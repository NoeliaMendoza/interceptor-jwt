# Interceptores HTTP en Angular con JWT y Spring Boot

Proyecto educativo que muestra cómo Angular adjunta un JWT a las peticiones HTTP
mediante un interceptor funcional y cómo Spring Boot autentica al usuario, firma
el token con HS256 y protege un endpoint verificando su firma y vencimiento.

## Contenido

- [Tecnologías](#tecnologías)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos](#requisitos)
- [Ejecutar la aplicación](#ejecutar-la-aplicación)
- [Probar el flujo JWT](#probar-el-flujo-jwt)
- [Endpoints](#endpoints)
- [Ejecutar las pruebas](#ejecutar-las-pruebas)
- [Cómo funciona el JWT](#cómo-funciona-el-jwt)
- [Consideraciones de seguridad](#consideraciones-de-seguridad)
- [Solución de problemas](#solución-de-problemas)

## Tecnologías

- **Frontend:** Angular 21, TypeScript y `HttpClient`.
- **Backend:** Java 17 o superior y Spring Boot 4.
- **Seguridad:** Spring Security, contraseña almacenada con BCrypt y JWT firmado
  con HMAC-SHA256 (`HS256`).
- **Herramienta de compilación:** Maven Wrapper incluido en la raíz.

## Estructura del proyecto

```text
Interceptores_Ejemplo/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/java/edu/demo/jwt/
│       │   ├── api/                  # Endpoint protegido
│       │   ├── auth/                 # Inicio de sesión y emisión del JWT
│       │   └── security/             # Validación JWT, usuarios y CORS
│       └── main/resources/
│           └── application.properties
├── frontend/
│   ├── public/
│   └── src/app/
│       ├── interceptors/             # Agrega el Bearer token a la API
│       ├── services/                 # Solicitudes HTTP
│       ├── app.config.ts             # Registro del interceptor
│       └── app.ts                    # Interfaz y visualización del payload
├── .mvn/                             # Configuración de Maven Wrapper
├── mvnw
└── mvnw.cmd
```

## Requisitos

- JDK 17 o superior. Comprueba la instalación con `java -version`.
- Node.js 22.12 o superior y npm. Compruébalos con `node --version` y
  `npm --version`.
- Conexión a internet en la primera ejecución para descargar dependencias.

## Ejecutar la aplicación

Hay que iniciar **dos servidores**, cada uno en su propia terminal de PowerShell.
Los comandos siguientes parten de la carpeta raíz del repositorio.

### Terminal 1: backend Spring Boot

```powershell
$env:JWT_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
.\mvnw.cmd -f backend\pom.xml spring-boot:run
```

La variable crea una clave aleatoria de 256 bits para esta ejecución. No cierres
esta terminal mientras uses la aplicación. El backend escucha en
`http://localhost:8080`. Cada JWT expira después de 15 minutos.

> Ejecuta el comando de `JWT_SECRET` cada vez que abras una terminal nueva para
> iniciar el backend. Al cambiar el secreto, los tokens anteriores dejan de ser
> válidos.

### Terminal 2: frontend Angular

Desde la raíz, ejecuta:

```powershell
Set-Location .\frontend
npm install
npm start
```

Abre `http://localhost:4200`. Si ya instalaste las dependencias, basta con
`npm start`.

## Probar el flujo JWT

1. En la aplicación, inicia sesión con la cuenta local de demostración:
   - **Usuario:** `estudiante`
   - **Contraseña:** `demo1234`
2. Pulsa **Obtener JWT firmado**. Angular envía las credenciales al backend y
   recibe el token firmado.
3. La interfaz muestra el token y los campos del payload: usuario, rol, emisión
   y vencimiento.
4. Pulsa **Enviar petición HTTP**. El interceptor agrega el encabezado:

   ```http
   Authorization: Bearer <token>
   ```

5. Para inspeccionarlo, abre las herramientas del navegador con **F12** y
   selecciona **Network → mensaje → Headers → Request Headers**.
6. Pulsa **Cerrar sesión (eliminar JWT)** y vuelve a enviar la petición. Como el
   token ya no se envía, el backend responde **401 Unauthorized**.

La cuenta está configurada en memoria para facilitar la demostración. No hace
falta crear una base de datos.

## Endpoints

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/login` | Público | Autentica las credenciales y devuelve un JWT HS256. |
| `GET` | `/api/mensaje` | Requiere JWT | Devuelve un mensaje para el usuario autenticado. |

Ejemplo del cuerpo enviado al iniciar sesión:

```json
{
  "username": "estudiante",
  "password": "demo1234"
}
```

Una respuesta correcta contiene `token`, `tokenType` y `expiresAt`. El endpoint
protegido responde `200` con un token válido y `401` si falta, es inválido o está
vencido.

## Ejecutar las pruebas

Desde la raíz, ejecuta las pruebas del backend:

```powershell
.\mvnw.cmd -f backend\pom.xml test
```

Las pruebas del backend comprueban el inicio de sesión correcto e incorrecto, el
acceso protegido con token válido y el rechazo de solicitudes sin token o con
token inválido.

Para compilar y probar Angular:

```powershell
Set-Location .\frontend
npm run build
npm test -- --watch=false
```

## Cómo funciona el JWT

Un JWT tiene tres partes codificadas en Base64URL, separadas por puntos:

```text
header.payload.signature
```

- **Header:** declara `HS256` y el tipo `JWT`.
- **Payload:** contiene `sub` (usuario), `rol`, `iat` (emisión) y `exp`
  (vencimiento).
- **Signature:** se calcula con HMAC-SHA256 y el secreto que conoce el backend.

El secreto se lee exclusivamente desde la variable de entorno `JWT_SECRET`. El
backend comprueba el algoritmo, la firma y el vencimiento con Spring Security
antes de ejecutar el endpoint protegido.

## Consideraciones de seguridad

- Esta aplicación es una **demostración local**, no una solución lista para
  producción.
- El usuario y la contraseña de ejemplo son públicos y el usuario está guardado
  en memoria.
- El payload de un JWT está codificado, **no cifrado**. No guardes datos
  sensibles dentro del token.
- Mostrar o decodificar el payload en Angular no verifica la firma. La
  validación se realiza en Spring Boot.
- No incluyas `JWT_SECRET` en el código ni lo subas al repositorio.
- Para un sistema real, usa HTTPS, credenciales y secretos adecuados al entorno,
  políticas de expiración y una estrategia segura para almacenar y renovar
  tokens.

## Solución de problemas

### Angular no logra conectarse al backend

- Comprueba que Spring Boot siga ejecutándose en el puerto `8080`.
- Inicia Angular en el puerto `4200`; el backend permite los orígenes
  `http://localhost:4200` y `http://127.0.0.1:4200`.
- Revisa la URL de la API en `frontend/src/app/api-url.ts`.

### El backend no inicia porque falta `JWT_SECRET`

Configura la variable en **la misma terminal** donde ejecutarás Maven:

```powershell
$env:JWT_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

La clave debe ser Base64 válida y representar al menos 32 bytes aleatorios.

### La API responde `401`

Inicia sesión de nuevo y verifica que el token no haya expirado. El token dura
15 minutos; además, deja de ser válido si reiniciaste el backend con otra clave
aleatoria.
