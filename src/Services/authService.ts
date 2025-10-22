import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, of, tap } from 'rxjs';
import { pki, util } from 'node-forge';  
import { environment } from '../Environments/environment.development';

export interface LoginCredentials {
  userName: string;
  password: string;
}

export interface VerifyPwdCredentials {
  userName: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private apiUrl = environment.API_URL;  

  private readonly GENERAL_HEADERS = {
    'DashboardKeyId': environment.DKEYID,
    'Content-Type': 'application/json'
  };

  constructor() { }


  private encryptPwd(pwd: string): string {
    try {

      const publicKeyArray = environment.PUBKEY.split('_');
      
      let publicKeyPem = '-----BEGIN PUBLIC KEY-----\n';
      publicKeyArray.forEach((line) => {
        publicKeyPem += line + '\n';
      });
      publicKeyPem += '-----END PUBLIC KEY-----';

      const publicKey = pki.publicKeyFromPem(publicKeyPem);

      const encryptedData = publicKey.encrypt(pwd, 'RSA-OAEP');

      return util.encode64(encryptedData);
    } catch (error) {
      console.error('❌ Error al encriptar contraseña:', error);
      throw new Error('No se pudo encriptar la contraseña');
    }
  }


  login(credentials: LoginCredentials): Observable<any> {
    const headers = new HttpHeaders(this.GENERAL_HEADERS);

    const encryptedCredentials = {
      ...credentials,
      password: this.encryptPwd(credentials.password)  
    };

    console.log('🔐 Enviando login con contraseña encriptada');

    return this.http.post(`${this.apiUrl}/Auth/Login`, encryptedCredentials, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ Respuesta de login:', response);
      }),
      catchError(error => {
        console.error('❌ Error en login:', error);
        throw error;
      })
    );
  }


  verifyPwd(credentials: VerifyPwdCredentials): Observable<any> {
    const headers = new HttpHeaders(this.GENERAL_HEADERS);

    const encryptedCredentials = {
      ...credentials,
      password: this.encryptPwd(credentials.password) 
    };

    console.log('🔐 Verificando contraseña encriptada');

    return this.http.post(`${this.apiUrl}/Auth/VerifyPwd`, encryptedCredentials, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ Respuesta de verificación:', response);
      }),
      catchError(error => {
        console.error('❌ Error al verificar contraseña:', error);
        throw error;
      })
    );
  }


  removeToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('session');
    localStorage.removeItem('User');
  }


  logout(): Observable<any> {
    const token = localStorage.getItem('session');
    const headers = new HttpHeaders({
      ...this.GENERAL_HEADERS,
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/Auth/Logout`, { headers }).pipe(
      tap(() => this.removeToken()),
      catchError(error => {
        console.error('Error durante el logout:', error);
        this.removeToken();
        return of(null);
      })
    );
  }

 
  closeSession(): void {
    this.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}