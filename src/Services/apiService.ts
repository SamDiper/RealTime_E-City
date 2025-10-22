import { Injectable } from '@angular/core';
import { environment } from '../Environments/environment.development';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LoginDto } from '../Interfaces/login';
import { Response } from '../Interfaces/response';
import { Observable } from 'rxjs';
//import * as CryptoJS from 'crypto-js';
import { JSEncrypt } from 'jsencrypt';
import { PayPadResponse, SubscriptionResponse } from '../Interfaces/locations';
import { TransactionResponse } from '../Interfaces/transactions';


declare var require: any;
//const forge = require('node-forge'); 

@Injectable({
  providedIn: 'root'
})
export class Api {
  public readonly flag = false;
  private readonly GENERAL_HEADERS = {
    'Content-Type': 'application/json',
    'DashboardKeyId': environment.DKEYID,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Allow': 'GET, POST, OPTIONS, PUT, DELETE'
  };

    constructor(private http: HttpClient) {}

    private encryptPwd(pwd: string): string {
      const publicKeyArray = environment.PUBKEY.split('_');
      let publicKeyPem = '-----BEGIN PUBLIC KEY-----\n';
      publicKeyPem += publicKeyArray.join('\n') + '\n';
      publicKeyPem += '-----END PUBLIC KEY-----';

      const encryptor = new JSEncrypt({
        default_key_size: '2048',
      });

      encryptor.setPublicKey(publicKeyPem);

      const encrypted = encryptor.encrypt(pwd);

      if (!encrypted) {
        throw new Error('Falló la encriptación de la contraseña');
      }
      console.log(encrypted)
      return encrypted;
    }

 private getHeaders(includeAuth: boolean = false): HttpHeaders {
  let headers: Record<string, string> = { ...this.GENERAL_HEADERS };
  
  if (includeAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return new HttpHeaders(headers);
}

  Login(credentials: LoginDto): Observable<Response> {
    const headers = this.getHeaders();
    
    const loginData = {
      ...credentials,
      password: this.encryptPwd(credentials.pwd)
    };
    
    return this.http.post<Response>(
      `${environment.API_URL}/Auth/Login`,
      loginData,
      { headers }
    );


  }

    VerifyPwd(credentials: LoginDto): Observable<Response> {
    const headers = this.getHeaders();
    
    const verifyData = {
      ...credentials,
      password: this.encryptPwd(credentials.pwd)
    };
    
    return this.http.post<Response>(
      `${environment.API_URL}/Auth/VerifyPwd`,
      verifyData,
      { headers }
    );
  }

  
  LogOut(): Observable<Response> {
    const headers = this.getHeaders(true);
    
    return this.http.get<Response>(
      `${environment.API_URL}/Auth/Logout`,
      { headers }
    );
  }


  GetAllUsers(): Observable<Response> {
    const headers = this.getHeaders(true);
    
    return this.http.get<Response>(
      `${environment.API_URL}/api/User`,
      { headers }
    );
  }


  GetLoggedUser(): Observable<Response> {
      const headers = this.getHeaders(true);
      
      return this.http.get<Response>(
        `${environment.API_URL}/api/User/Logged`,
        { headers }
      );
    }

  GetAllPaypads(): Observable<PayPadResponse> {
    const headers = this.getHeaders(true);
    
    return this.http.get<PayPadResponse>(
      `${environment.API_URL}/api/PayPad`,
      { headers }
    );
  }

  GetAllSubscriptions(): Observable<SubscriptionResponse> {
    const headers = this.getHeaders(true);
    
    return this.http.get<SubscriptionResponse>(
      `${environment.API_URL}/api/Alerts/Subscription`,
      { headers }
    );
  }
  GetTransactionsById(idPaypad:number): Observable<TransactionResponse> {
    const headers = this.getHeaders(true);
    
    return this.http.get<TransactionResponse>(
      `${environment.API_URL}/api/Transaction/${idPaypad}`,
      { headers }
    );
  }

  
  GetAllTransactions(): Observable<TransactionResponse> {
    const headers = this.getHeaders(true);
    
    return this.http.get<TransactionResponse>(
      `${environment.API_URL}/api/Transaction`,
      { headers }
    );
  }

  GetTransactionAmounts(paypadId: number): Observable<TransactionResponse> {
    const headers = this.getHeaders(true);

    const startDate = new Date('2021-01-01T05:00:00.000Z').toISOString();

    const endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999);

    const body = {
      id: paypadId,        
      from: startDate,     
      to: endDate.toISOString()
    };

    return this.http.post<TransactionResponse>(
      `${environment.API_URL}/api/Transaction/GetByDate`,
      body,
      { headers }
    );
  }



}
