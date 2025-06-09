import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule, CloudAppTranslateModule, AlertModule } from '@exlibris/exl-cloudapp-angular-lib';
import { MenuModule } from '@exlibris/exl-cloudapp-angular-lib';
import { SelectEntitiesModule } from 'eca-components';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TopmenuComponent } from './topmenu/topmenu.component';
import { MainComponent } from './main/main.component';
import { PmcforthcomingComponent } from './pmcforthcoming/pmcforthcoming.component';
import { TitlechangeComponent } from './titlechange/titlechange.component';
import { DatePipe } from '@angular/common';




@NgModule({
  declarations: [
    AppComponent,
    TopmenuComponent,
    MainComponent,
    PmcforthcomingComponent,
    TitlechangeComponent,
  ],
  imports: [
    MaterialModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    AlertModule,
    FormsModule,
    ReactiveFormsModule,     
    CloudAppTranslateModule.forRoot(),
    MenuModule,
    SelectEntitiesModule,
  ],
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'standard' } }, DatePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
