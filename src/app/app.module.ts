import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

import { HttpClientModule } from '@angular/common/http';

import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { HomeComponent } from './home/home.component';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { FileDropModule } from 'ngx-file-drop';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';    
import { ToastrModule } from 'ngx-toastr';

import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

import { AuthGuard } from './auth.guard';

import { EmojiModule } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { VideocallComponent } from './videocall/videocall.component';
import {ImageCropperComponent, CropperSettings} from 'ng2-img-cropper';

const config: SocketIoConfig = { url: 'http://megachat.info:3000', options: {} };

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    HomeComponent,
    VideocallComponent,
    ImageCropperComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    AngularFontAwesomeModule,
    PickerModule,
    EmojiModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({  
      positionClass:'top-left',  
      closeButton: true
    }),
    SocketIoModule.forRoot(config),
    FileDropModule
  ],
  providers: [
    AuthGuard,
    {provide: LocationStrategy, useClass: HashLocationStrategy}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
