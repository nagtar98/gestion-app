import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Validador asíncrono para comprobar si el correo existe al hacer login.
 */
export function emailExistsValidator(authService: AuthService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.value;

    // Si el campo está vacío, la validación síncrona obligatoria se encarga
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      return of(null);
    }

    // Validar formato completo con dominio antes de consultar
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      return of(null);
    }

    // Debounce de 400ms con timer para evitar llamadas continuas mientras el usuario escribe
    return timer(400).pipe(
      switchMap(() => authService.checkEmailExists(value)),
      map(exists => {
        // En el flujo de Login, el correo debe estar previamente registrado en el sistema
        return exists ? null : { emailNotRegistered: true };
      }),
      catchError(() => {
        // En caso de fallo de red en la validación asíncrona, no bloquear pero informar
        return of({ verificationFailed: true });
      })
    );
  };
}

/**
 * Validador asíncrono para verificar que un correo no esté ya registrado.
 */
export function emailUniqueValidator(authService: AuthService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.value;

    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      return of(null);
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      return of(null);
    }

    return timer(400).pipe(
      switchMap(() => authService.checkEmailExists(value)),
      map(exists => {
        // En el flujo de Alta de registro, el correo NO debe existir
        return exists ? { emailAlreadyExists: true } : null;
      }),
      catchError(() => of(null))
    );
  };
}
