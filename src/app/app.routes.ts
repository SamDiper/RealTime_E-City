import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { Dashboard } from './components/dashboard/dashboard';
import { Login } from './components/login/login';
import { Charts } from './components/charts/charts';
import { Transactions } from './components/transactions/transactions';

export const routes: Routes = [
    {path:'login', component: Login},
    {path:'dashboard', canActivate: [authGuard], component: Dashboard},
    {path:'charts', canActivate: [authGuard], component: Charts},
    {path:'transactions', canActivate: [authGuard], component: Transactions},
    { path: "**", pathMatch: "full", redirectTo: "login" }

];
