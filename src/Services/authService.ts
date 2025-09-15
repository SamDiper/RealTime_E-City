import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {


  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private apiUrl = 'https://localhost:7137'; // Reemplaza con la URL base de tu API

  constructor() { }

  /**
   * Elimina el token del localStorage.
   */
  removeToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('session'); // Manteniendo la compatibilidad con tu código de React
    localStorage.removeItem('User');
  }

  /**
   * Llama al endpoint de logout en el servidor.
   * @returns Un Observable que indica si la llamada fue exitosa.
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.removeToken()),
      catchError(error => {
        console.error('Error durante el logout:', error);
        this.removeToken();
        // Se puede re-lanzar el error o retornar un observable que no rompa la cadena
        return of(null); // Retorna un observable vacío para no romper la suscripción
      })
    );
  }

  /**
   * Cierra la sesión del usuario completamente.
   */
  closeSession(): void {
    // Llama a la función de logout del servicio y se suscribe
    this.logout().subscribe({
      next: () => {
        // Redirige al usuario después de un logout exitoso (o con error de API)
        this.router.navigate(['/login']);
      },
      error: () => {
        // Aunque el catchError del servicio ya maneja el error,
        // nos aseguramos de que la redirección ocurra.
        this.router.navigate(['/login']);
      }
    });
  }
}
