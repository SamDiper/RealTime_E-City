import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  const token = localStorage.getItem('session');

  const authRequest = token? req.clone({
    setHeaders:{
      Authorization : `Bearer ${token}`
    }
  }):req;

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse)=>{
      if(error.status == 401 || error.status == 403){
        localStorage.removeItem('session');
        router.navigate(['login']);
      }
      return throwError(() => error);
    })
  );
};
