import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { Dashboard } from '../Components/Pages/dashboard/dashboard';
import { Login } from '../Components/Pages/login/login';
import { Charts } from '../Components/Pages/charts/charts';

export const routes: Routes = [
    {path:'login', component: Login},
    {path:'dashboard', canActivate: [authGuard], component: Dashboard},
    {path:'charts', canActivate: [authGuard], component: Charts},
    { path: "**", pathMatch: "full", redirectTo: "login" }

];
