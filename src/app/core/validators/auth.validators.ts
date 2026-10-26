import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * @fileoverview Validadores asíncronos para formularios reactivos de autenticación.
 * Permite comprobar la existencia o unicidad de cuentas en backend/base de datos.
 * @module Core/Validators/AuthValidators
 */

/**
 * Fabrica un validador asíncrono para verificar si un correo electrónico existe en la base de datos.
 * Aplica una pausa (debounce) de 400ms antes de emitir la petición para optimizar el rendimiento.
 *
 * @param authService Servicio de autenticación inyectado con métodos de consulta.
 * @returns Función de validación asíncrona conforme a la API de Angular ReactiveFormsModule.
 */
export function emailExistsValidator(authService: AuthService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.value;

    // Si el campo está vacío, la validación síncrona obligatoria se encarga
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      return of(null);
    }

    // Si el formato aún no es un email válido básico, diferir
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
