import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api-url';

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);

  iniciarSesion(username: string, password: string) {
    return this.http.post<LoginResponse>(`${API_URL}/api/auth/login`, {
      username,
      password,
    });
  }

  obtenerMensaje() {
    return this.http.get<{ mensaje: string }>(`${API_URL}/api/mensaje`);
  }
}
