import { HttpInterceptorFn } from '@angular/common/http';
import { API_URL } from '../api-url';
export const authInterceptor: HttpInterceptorFn = (req, next) => {

  // Obtener el token JWT guardado.
  const token = sessionStorage.getItem('jwt');

  // Verificar que la petición sea a nuestra API
  // y que no corresponda al inicio de sesión.
  const isProtectedApiRequest = 
    req.url.startsWith(`${API_URL}/api/`) &&
    req.url !== `${API_URL}/api/auth/login`;

  // Si existe un token y la petición es protegida,
  // agregar el JWT al encabezado Authorization.
  if (token && isProtectedApiRequest) {
    const peticionAutenticada = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Interceptor JWT ejecutado');

    // Continuar con la petición modificada.
    return next(peticionAutenticada);
  }

  // Mostrar un mensaje si no se envía el JWT.
  if (isProtectedApiRequest) {
    console.log('Petición protegida enviada sin JWT');
  }

  // Continuar con la petición original.
  return next(req);
};
