import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../../Services/authService';
import { Api } from '../../Services/apiService';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(Api);

  if(!localStorage.getItem('session') || !localStorage.getItem('token')){
    router.navigate(['login']);
    return false;
  }

  return true;
};
