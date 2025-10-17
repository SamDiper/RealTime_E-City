import { Component, inject } from '@angular/core';
import {ChangeDetectionStrategy, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormControl, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {merge} from 'rxjs';
import { Auth } from '../../../Services/authService';
import { Api } from '../../../Services/apiService';
import { Router } from '@angular/router';
import { LoginDto } from '../../../Interfaces/login';
import { Response } from '../../../Interfaces/response';

@Component({
  selector: 'app-login',
  imports: [ FormsModule, ReactiveFormsModule ],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {

 // Form controls para manejar el estado del formulario
  readonly user = new FormControl('', [Validators.required]);
  readonly password = new FormControl('', [Validators.required]);

  // Señales (signals) para la lógica de la UI
  showPassword = signal(false);
  errorMessage = signal('');
  loading = signal(false);
  
  // Servicios inyectados
  private readonly _apiComponent = inject(Api);
  private readonly router = inject(Router);

  // Variables para la vista
  _currentYear: number = new Date().getFullYear();
  constructor() {
    // Escuchar cambios en el estado y valor del email para mostrar errores
    merge(this.user.statusChanges, this.user.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateEmailErrorMessage());
  }

  // Método para manejar el evento de clic en el ícono de visibilidad
  togglePasswordVisibility(event: MouseEvent) {
    this.showPassword.set(!this.showPassword());
    event.stopPropagation();
  }

  // Manejador del envío del formulario
  onSubmit(): void {
    // Verifica que ambos campos sean válidos
    if (this.user.valid && this.password.valid) {
      this.loading.set(true);
           console.log('OnSubmit');

      const loginData: LoginDto = {
        userName: this.user.value!.trim(), // Usar `email.value!` para acceder al valor no-nulo
        pwd: this.password.value!
      };
     console.log('Login data:', loginData);
      this._apiComponent.Login(loginData).subscribe({
        next: (response: any) => {
         console.log('Response:', response);
         console.log('Status Code:', response.statusCode);
         console.log('Status Code:', response);
          if (response.statusCode === 200 && typeof response.response === 'string') {
              const token = response.response;

              localStorage.setItem("token", token);
              localStorage.setItem("session", token);
              localStorage.setItem("User", loginData.userName);

              this.router.navigate(['/dashboard']);
              console.log('Token:', token);
            } else {
              this.loading.set(false);
              this.errorMessage.set(response?.message || "Credenciales incorrectas");
            }
        },
        error: (error: any) => {
          this.loading.set(false);
          if (error.status === 400) {
            this.errorMessage.set("Usuario y/o contraseña incorrecto");
          } else if (error.status === 0) {
            this.errorMessage.set("No se pudo conectar con el servidor. Revise su conexión");
          } else if (error.status === 401) {
            this.errorMessage.set("Credenciales inválidas");
          } else {
            this.errorMessage.set(error.error?.message || "Error interno del servidor");
          }
          console.error('Error de login:', error);
        }
      });
    } else {
      // Si el formulario es inválido, muestra los mensajes de error
      this.updateEmailErrorMessage();
      this.updatePasswordErrorMessage();
    
  } 
}

  // Actualiza el mensaje de error del email
  updateEmailErrorMessage() {
    if (this.user.hasError('required')) {
      this.errorMessage.set('El usuario es requerido');
    } else if (this.user.hasError('email')) {
      this.errorMessage.set('Usuario no válido');
    } else {
      this.errorMessage.set('');
    }
  }

  // Actualiza el mensaje de error de la contraseña
  updatePasswordErrorMessage() {
    if (this.password.hasError('required')) {
      this.errorMessage.set('La contraseña es requerida');
    }
  }
}