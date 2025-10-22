// components/login/login.ts
import { Component, inject, signal } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { merge } from 'rxjs';
import { Router } from '@angular/router';
import { Auth } from '../../../Services/authService';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../../../output.css'],
})
export class Login {
  readonly user = new FormControl('', [Validators.required]);
  readonly password = new FormControl('', [Validators.required]);

  showPassword = signal(false);
  errorMessage = signal('');
  loading = signal(false);

  private readonly authService = inject(Auth); 
  private readonly router = inject(Router);

  _currentYear: number = new Date().getFullYear();

  constructor() {
    merge(this.user.statusChanges, this.user.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateUserErrorMessage());
  }

  togglePasswordVisibility(event: MouseEvent) {
    this.showPassword.set(!this.showPassword());
    event.stopPropagation();
  }

  ngOnInit(): void {
    localStorage.clear();
  }

  onSubmit(): void {
    if (!this.user.valid || !this.password.valid) {
      this.updateUserErrorMessage();
      this.updatePasswordErrorMessage();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const credentials = {
      userName: this.user.value!.trim(),
      password: this.password.value!  
    };

    this.authService.login(credentials).subscribe({
      next: (response: any) => {

        if (response.statusCode === 200 && response.response) {
          const token = typeof response.response === 'string' 
            ? response.response 
            : response.response.token;

          localStorage.setItem('token', token);
          localStorage.setItem('session', token);
          localStorage.setItem('User', credentials.userName);


          this.router.navigate(['/dashboard']);
        } else {
          this.loading.set(false);
          const errorMsg = response?.message || 'Credenciales incorrectas';
          this.errorMessage.set(errorMsg);
          
        }
      },
      error: (error: any) => {
        this.loading.set(false);


        let errorMsg = 'Error interno del servidor';

        if (error.status === 400) {
          errorMsg = 'Usuario y/o contraseña incorrecto';
        } else if (error.status === 0) {
          errorMsg = 'No se pudo conectar con el servidor. Revise su conexión';
        } else if (error.status === 401) {
          errorMsg = 'Credenciales inválidas';
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        }

        this.errorMessage.set(errorMsg);
      }
    });
  }

  updateUserErrorMessage() {
    if (this.user.hasError('required')) {
      this.errorMessage.set('El usuario es requerido');
    } else {
      this.errorMessage.set('');
    }
  }

  updatePasswordErrorMessage() {
    if (this.password.hasError('required')) {
      this.errorMessage.set('La contraseña es requerida');
    }
  }
}