import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api.service';

interface JwtPayload {
  sub: string;
  rol: string;
  iat: number;
  exp: number;
}

@Component({
  selector: 'app-root',
  imports: [DatePipe, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly api = inject(ApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  mensaje = 'Esperando una acción...';
  usuario = 'estudiante';
  contrasena = 'demo1234';
  cargando = false;
  jwt = sessionStorage.getItem('jwt') ?? '';
  datos: JwtPayload | null = null;



  constructor() {
    if (this.jwt) {
      this.decodificarJwt();
    }
  }

  obtenerJwt(): void {
    this.cargando = true;
    this.mensaje = 'Autenticando credenciales con el backend...';

    this.api.iniciarSesion(this.usuario, this.contrasena).subscribe({
      next: (respuesta) => {
        this.jwt = respuesta.token;
        sessionStorage.setItem('jwt', this.jwt);
        this.decodificarJwt();
        this.mensaje = 'Inicio de sesión correcto: el backend firmó el JWT con HS256.';
        this.cargando = false;
        this.changeDetector.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.mensaje =
          error.status === 401
            ? 'Credenciales incorrectas. Revisa el usuario y la contraseña.'
            : 'No se pudo conectar con el backend. Comprueba que Spring Boot esté ejecutándose en el puerto 8080.';
        this.cargando = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  decodificarJwt(): void {
    try {
      const partes = this.jwt.split('.');
      if (partes.length !== 3 || !partes[1]) {
        throw new Error('El token no tiene tres partes.');
      }

      const payloadBase64 = partes[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const payloadConPadding = payloadBase64.padEnd(
        Math.ceil(payloadBase64.length / 4) * 4,
        '=',
      );
      const bytes = Uint8Array.from(atob(payloadConPadding), (caracter) =>
        caracter.charCodeAt(0),
      );
      const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));

      if (typeof payload !== 'object' || payload === null) {
        throw new Error('El payload no es un objeto.');
      }

      const claims = payload as Record<string, unknown>;
      if (
        typeof claims['sub'] !== 'string' ||
        typeof claims['rol'] !== 'string' ||
        typeof claims['iat'] !== 'number' ||
        typeof claims['exp'] !== 'number'
      ) {
        throw new Error('El payload no contiene los datos esperados.');
      }

      this.datos = {
        sub: claims['sub'],
        rol: claims['rol'],
        iat: claims['iat'],
        exp: claims['exp'],
      };
    } catch {
      this.datos = null;
      this.mensaje = 'Formato JWT inválido: no se pudo leer el payload.';
    }
  }

  enviarPeticion(): void {
    this.api.obtenerMensaje().subscribe({
      next: (respuesta) => {
        this.mensaje = respuesta.mensaje;
        this.changeDetector.markForCheck();
      },
      error: (error: { status: number }) => {
        this.mensaje =
          error.status === 401
            ? 'Acceso no autorizado (401): inicia sesión o carga un JWT válido.'
            : `Error HTTP: ${error.status}`;
        this.changeDetector.markForCheck();
      },
    });
  }

  eliminarJwt(): void {
    sessionStorage.removeItem('jwt');
    this.jwt = '';
    this.datos = null;
    this.mensaje = 'JWT eliminado';
  }
}
