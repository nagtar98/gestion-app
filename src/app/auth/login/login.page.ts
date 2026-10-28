import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonText,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonSpinner,
  IonIcon,
  IonNote,
  IonButtons
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  personOutline,
  lockClosedOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  sunnyOutline,
  moonOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { emailExistsValidator } from '../../core/validators/auth.validators';

/**
 * Página de inicio de sesión.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonInput,
    IonText,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonSpinner,
    IonIcon,
    IonNote,
    IonButtons
  ]
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  public themeService = inject(ThemeService);

  /** Formulario reactivo de autenticación */
  loginForm: FormGroup;

  /** Estado de envío del formulario para prevenir doble submit y mostrar spinner */
  isSubmitting = false;

  /** Mensaje de error global retornado por el servicio de autenticación */
  errorMessage: string | null = null;

  public toggleTheme(): void {
    this.themeService.toggleTheme();
    this.cdr.markForCheck();
  }

  constructor() {
    addIcons({
      personOutline,
      lockClosedOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      informationCircleOutline,
      sunnyOutline,
      moonOutline
    });

    // Formulario de login
    this.loginForm = this.fb.group({
      email: [
        '',
        {
          validators: [Validators.required, Validators.email],
          asyncValidators: [emailExistsValidator(this.authService)],
          updateOn: 'change'
        }
      ],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Ciclo de vida de Ionic ejecutado cada vez que la vista entra en primer plano.
   * Garantiza la destrucción segura de cualquier sesión previa y limpia los campos del formulario.
   */
  ionViewWillEnter(): void {
    // 1. Destrucción segura de la sesión anterior
    this.authService.logout();
    this.errorMessage = null;
    this.isSubmitting = false;

    // 2. Limpieza de los controles visuales del formulario reactivo
    if (this.loginForm) {
      this.loginForm.reset();
      this.loginForm.markAsPristine();
      this.loginForm.markAsUntouched();
    }
    this.cdr.markForCheck();
  }

  /**
   * Atajo de conveniencia para rellenar rápidamente credenciales de prueba.
   * Facilita la corrección y evaluación del proyecto (Administrador / Usuario Estándar).
   *
   * @param role Tipo de credencial a autocompletar.
   */
  public fillDemoCredentials(role: 'admin' | 'user'): void {
    if (role === 'admin') {
      this.loginForm.setValue({
        email: 'admin@empresa.com',
        password: 'admin123'
      });
    } else {
      this.loginForm.setValue({
        email: 'usuario@empresa.com',
        password: 'user123'
      });
    }
    this.loginForm.markAsDirty();
    this.loginForm.markAllAsTouched();
    this.loginForm.get('email')?.updateValueAndValidity();
    this.errorMessage = null;
    this.cdr.markForCheck();
  }

  /**
   * Procesa el envío del formulario autenticando al usuario contra el AuthService.
   */
  public onSubmit(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      this.loginForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        // Redirección hacia el cuadro de mando tras validar credenciales
        this.router.navigate(['/dashboard']);
      },
      error: (err: Error) => {
        this.isSubmitting = false;
        this.errorMessage = err.message || 'Error en las credenciales proporcionadas.';
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Determina si la verificación asíncrona del correo está pendiente.
   */
  public get isEmailValidating(): boolean {
    const emailCtrl = this.loginForm.get('email');
    return emailCtrl ? emailCtrl.pending : false;
  }
}
