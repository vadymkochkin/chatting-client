import { NgModule } from '@angular/core';
import { ExtraOptions, Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './auth.guard';

import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { HomeComponent } from './home/home.component';
import { VideocallComponent } from './videocall/videocall.component';

const routes: Routes = [
  {
    path: '',
    component: LoginComponent
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard] // !!! HERE !!!
  },
  {
    path: 'videocall',
    component: VideocallComponent,
    canActivate: [AuthGuard] // !!! HERE !!!
  },
  {
    path: 'videocallcreate',
    component: VideocallComponent,
    canActivate: [AuthGuard] // !!! HERE !!!
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        component: LoginComponent
      },
      {
        path: 'register',
        component: SignupComponent
      }
    ]
  },
  { path: '**', redirectTo: 'home' },
];

const config: ExtraOptions = {
  useHash: true,
  onSameUrlNavigation: 'reload'
};

@NgModule({
  imports: [RouterModule.forRoot(routes, config)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
