import { Subscription } from 'rxjs'

import { DOCUMENT } from '@angular/common'
import { Component, Inject, OnDestroy, OnInit } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { NavigationEnd } from '@angular/router'
//import { MatFormFieldModule } from '@angular/material/form-field';
import { MDCBanner } from '@material/banner'

import { SettingsService, SettingsType } from '../services'
import { LogService } from '../services/log.service'

@Component({
  selector: 'rangertrak-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss']
})
export class AlertsComponent implements OnInit, OnDestroy {

  private id = 'Alerts Component'
  isAlertHidden: boolean
  private alertBanner: HTMLElement | null = null
  emoji = 'emoji_people'
  private settingsSubscription!: Subscription
  private settings!: SettingsType

  constructor(
    private _snackBar: MatSnackBar,
    private log: LogService,
    private settingsService: SettingsService,
    @Inject(DOCUMENT) private document: Document) {
    // ======== Constructor() ============
    this.isAlertHidden = true;
  }

  ngOnInit(): void {
    console.log('AlertComponent.ngInit')

    this.settingsSubscription = this.settingsService.getSettingsObserver().subscribe({
      next: (newSettings) => {
        this.settings = newSettings
        this.log.excessive('Received new Settings via subscription.', this.id)
      },
      error: (e) => this.log.error('Settings Subscription got:' + e, this.id),
      complete: () => this.log.info('Settings Subscription complete', this.id)
    })

    this.alertBanner = this.document.querySelector('.mdc-banner')
    if (this.alertBanner == null) {
      console.log("Alerts:ngInit() couldn't find alert Banner!")
    }
  }

  Banner(msg: string, action1: string | undefined = 'Close', action2: string | undefined = "Close") {
    // https://material.io/components/banners#usage  //@use "@material/banner/styles";

    //console.log(`BANNER Called with ${msg}`)

    /*if (emoj != null) {
      this.emoji = emoj // REVIEW: Change to emoji is permanent, not temporary: OK?
    }*/

    if (this.alertBanner == null) {
      console.log('REVIEW: AlertComponent.Banner() called BEFORE AlertComponent.ngInit!')
      this.alertBanner = this.document.querySelector('.mdc-banner')
    }

    if (this.alertBanner != null) {
      const banner = new MDCBanner(this.alertBanner)
      banner.open()
      banner.setText(msg)
      banner.setPrimaryActionText(action1)
      banner.setSecondaryActionText(action2)
      //banner.layout()
      console.log(`BANNER displayed with ${msg}`)
    } else {
      console.log("Could not locate alertBanner !!!!")
    }
    //this.openSnackBar(`No Rangers found. Please enter them into the grid and then use the Update button,  or provide a Rangers.JSON file to import from or FUTUREE: Import them from an Excel file.`, `Nota Bene`, 1000)
    //  this.openSnackBar(`Imported "${this.rangers.length}" rangers.`, `Nota Bene`, 2000)

  }

  // https://v5.material.angular.io/components/snack-bar/overview
  OpenSnackBar(message: string, action: string, duration = 0) {
    this._snackBar.open(message, action, { duration: duration, verticalPosition: 'top' })
  }

  onBtnCloseAlert() {
    console.log(`onBtnCloseAlert() called`)
  }

  onBtnCloseBottomAlert() {
    console.log(`onBtnCloseBottomAlert() called`)
    this.isAlertHidden = true;
  }

  dbug(msg: string, alerts: boolean) {
    var dt = new Date();
    var dbugLog = document.getElementById("dbugLog")
    var time = this.zeroFill(dt.getHours(), 2) + ":" + this.zeroFill(dt.getMinutes(), 2) + ":" + this.zeroFill(dt.getSeconds(), 2) + ":" + this.zeroFill(dt.getMilliseconds(), 4);
    if (dbugLog) {
      var dbugMsg = time + "-  &nbsp;&nbsp;" + msg + "<br>" + dbugLog.innerHTML;
      dbugLog.innerHTML = dbugMsg;
    }
    // TODO: Only if settings say to do this!
    // console.log("Ranger Track: " + dbugMsg); // Convert dbugLog from HTML to plain text...
    if (alerts == true) {
      //document.getElementById('#alerts').html("<strong>Alert!</strong> "+time + "-  &nbsp;&nbsp;" + msg);
      //document.getElementById('#alerts').fadeIn().delay(2500).fadeOut();
    }
  }

  // REVIEW: or just use: toFixed(#)
  zeroFill(integ: number, lngth: number) {
    var strg = integ.toString();
    while (strg.length < lngth)
      strg = "0" + strg;
    return strg;
  }

  ngOnDestroy() {
    this.settingsSubscription.unsubscribe()
  }
}


