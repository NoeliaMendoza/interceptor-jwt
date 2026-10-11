import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../api-url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    sessionStorage.removeItem('jwt');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    sessionStorage.removeItem('jwt');
  });

  it('adds the Bearer header to the demo request when a JWT exists', () => {
    const token = 'demo.jwt.token';
    sessionStorage.setItem('jwt', token);

    http.get(`${API_URL}/api/mensaje`).subscribe();

    const request = httpTestingController.expectOne(`${API_URL}/api/mensaje`);
    expect(request.request.headers.get('Authorization')).toBe(
      `Bearer ${token}`,
    );
    request.flush({ mensaje: 'ok' });
  });

  it('does not add the Bearer header when no JWT exists', () => {
    http.get(`${API_URL}/api/mensaje`).subscribe();

    const request = httpTestingController.expectOne(`${API_URL}/api/mensaje`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ mensaje: 'ok' });
  });
});
