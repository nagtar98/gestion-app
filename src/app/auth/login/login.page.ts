import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonText, IonButton } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonText, IonButton
  ] 
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    // Configuración del formulario reactivo con validaciones[cite: 1, 4]
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], // Aquí se añadirá el validador asíncrono[cite: 1]
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

 ngOnInit() {
    // Al entrar a la pantalla de login, destruimos la sesión anterior
    localStorage.removeItem('userRole');
  }
  onSubmit() {
    if (this.loginForm.valid) {
      // Simulamos la respuesta del servidor y la asignación del rol[cite: 1]
      localStorage.setItem('userRole', 'Administrador');
      this.router.navigate(['/dashboard']);
    }
  }
}
