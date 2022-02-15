import { FieldReportService, FieldReportSource, FieldReportStatusType, FieldReportType, MarkerService, PopupService, RangerService, RangerType, SettingsService, SettingsType, ShapeService, TeamService, TeamType } from './shared/services/';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { AgGridModule } from 'ag-grid-angular';
import { ColorEditor } from './settings/color-editor.component';
import { MoodEditor } from './settings/mood-editor.component';
import { MoodRenderer } from './settings/mood-renderer.component';
//import { AgmCoreModule } from '@agm/core';
import { AlertsComponent } from './alerts/alerts.component';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { EntryComponent } from './entry/entry.component';
import { FieldReportsComponent } from './field-reports/field-reports.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FooterComponent } from './footer/footer.component';
import { GmapComponent } from './gmap/gmap.component';
import { GoogleMapsModule } from '@angular/google-maps'
import { HttpClientModule } from '@angular/common/http';
import { LazyModule } from './lazy/lazy.module'
import { LmapComponent } from './lmap/lmap.component';
import { LogComponent } from './log/log.component';
import { NgxMatDatetimePickerModule, NgxMatNativeDateModule, NgxMatTimepickerModule } from '@angular-material-components/datetime-picker'
import { MAT_COLOR_FORMATS, NgxMatColorPickerModule, NGX_MAT_COLOR_FORMATS } from '@angular-material-components/color-picker'
import { MDCBanner } from '@material/banner'
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { MaterialModule } from './material.module';

import { NavbarComponent } from './navbar/navbar.component';
import { NgModule } from '@angular/core';
import { RangersComponent } from './rangers/rangers.component';
import { SettingsComponent } from './settings/settings.component';
import { X404Component } from './x404/x404.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

// from ionic-app.module.ts
//import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
//import { File } from '@ionic-native/file/ngx';

//import { AgmSnazzyInfoWindowModule } from '@agm/snazzy-info-window';
// REVIEW: import of AgmSnazzyInfoWindowModule yields: D:\Projects\RangerTrak\rangertrak\src\app\app.module.ts depends on '@agm/snazzy-info-window'. CommonJS or AMD dependencies can cause optimization bailouts.
// https://angular.io/guide/build#configuring-commonjs-dependencies

@NgModule({

  // Import sub-modules
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    FormsModule,
    GoogleMapsModule,
    HttpClientModule,
    MaterialModule,
    ReactiveFormsModule,
    AppRoutingModule,
    FontAwesomeModule,
    AgGridModule.withComponents([
      MoodEditor,
      MoodRenderer,
    ]),
    //AgmCoreModule.forRoot({ apiKey: 'AIzaSyDDPgrn2iLu2p4II4H1Ww27dx6pVycHVs4' }),
    // AgmSnazzyInfoWindowModule, // BUG: API_KEY
    LazyModule,
    NgxMatColorPickerModule,
    NgxMatDatetimePickerModule,
    NgxMatTimepickerModule,
    NgxMatNativeDateModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
    //, IonicModule.forRoot()
  ],

  // Define all the components, directives and pipes, that are declared and used inside this module.
  // If you want to use any of these in multiple modules, bundle it into a separate module & import that in the module
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    AlertsComponent,
    GmapComponent,
    LmapComponent,
    EntryComponent,
    FieldReportsComponent,
    SettingsComponent,
    ColorEditor,
    MoodEditor,
    MoodRenderer,
    RangersComponent,
    X404Component,
    LogComponent
  ],

  // Define any required @Injectables. Any sub-components or modules can get the same @Injectable instance via dependency injection.
  // In the case of the AppModule, these @Injectables are application-scoped
  providers: [
    TeamService, RangerService, FieldReportService, MarkerService, PopupService, SettingsService, ShapeService,
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 2500 } },
    { provide: MAT_COLOR_FORMATS, useValue: NGX_MAT_COLOR_FORMATS }
  ],
  //{provide: MAT_BANNER_DEFAULT_OPTIONS}],
  // Team, Ranger,
  // providers: [File, { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],

  bootstrap: [AppComponent]//,

  // Make components, directives or pipes available to other modules...
  // , exports: [
  //   SettingsComponent
  // ]
})
export class AppModule { }

