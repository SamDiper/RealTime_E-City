import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { Dashboard } from '../Components/Pages/dashboard/dashboard';
import { Login } from '../Components/Pages/login/login';

export const routes: Routes = [
    {path:'login', component: Login},
    {path:'dashboard', canActivate: [authGuard], component: Dashboard},
    { path: "**", pathMatch: "full", redirectTo: "login" }

];
