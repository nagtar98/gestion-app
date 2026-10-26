import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth-guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  const mockAuthService = {
    isAuthenticated: () => true,
    getCurrentUserRole: () => 'Administrador'
  };

  const mockRouter = {
    navigate: () => Promise.resolve(true),
    parseUrl: (url: string) => ({ url } as any)
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('debe crearse e instanciarse correctamente el guardián de autenticación', () => {
    expect(guard).toBeTruthy();
    expect(guard.canActivate()).toBe(true);
  });
});
