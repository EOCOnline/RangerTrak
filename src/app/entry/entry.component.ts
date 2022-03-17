import { DOCUMENT } from '@angular/common'
import { Component, Inject, OnInit, ViewChild, isDevMode, Input, NgZone, AfterViewInit, OnDestroy } from '@angular/core'
import { ThemePalette } from '@angular/material/core'
import { FormBuilder, FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { HttpClient } from '@angular/common/http'

import { MatSnackBar } from '@angular/material/snack-bar'
import { Observable, debounceTime, map, startWith, switchMap, subscribeOn, Subscription } from 'rxjs'
import { AlertsComponent } from '../shared/'
import { FieldReportService, FieldReportStatusType, RangerService, LogService, RangerType, SettingsService, SettingsType, LocationType } from '../shared/services/'
import { TimePickerComponent } from '../shared/';
// IDEA: use https://material.angular.io/components/badge/ ???

@Component({
  selector: 'rangertrak-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.scss'],
  providers: [RangerService, FieldReportService, SettingsService] //, TeamService
})
export class EntryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('timePicker') timePicker: any; // https://blog.angular-university.io/angular-viewchild/

  private id = 'Entry Form'
  public title = 'Field Report Entry'

  // Get location events from <location> component
  private locationSubscription!: Subscription
  public location!: LocationType

  private rangersSubscription!: Subscription
  public rangers: RangerType[] = []
  filteredRangers: Observable<RangerType[]>

  private settingsSubscription!: Subscription
  public settings!: SettingsType

  // Get time events from <timepicker> component
  private timeSubscription!: Subscription
  public time!: Date

  alert: any

  // --------------- ENTRY FORM -----------------
  // control creation in a component class = immediate access to listen for, update, and validate state of the form input: https://angular.io/guide/reactive-forms#adding-a-basic-form-control
  public entryDetailsForm!: FormGroup
  callsignCtrl = new FormControl()

  //myForm!: FormGroup
  locationFrmGrp!: FormGroup
  dateCtrl = new FormControl(new Date())
  //timepickerFormControl!: FormControl

  submitInfo: HTMLElement | null = null
  callInfo: HTMLElement | null = null

  // https://github.com/h2qutc/angular-material-components
  // TODO: Consider for tracking ValueChanges: https://angular.io/guide/observables-in-angular#reactive-forms

  constructor(
    private _formBuilder: FormBuilder,
    private rangerService: RangerService,
    private fieldReportService: FieldReportService,
    private log: LogService,
    private settingsService: SettingsService,
    private _snackBar: MatSnackBar,
    private http: HttpClient,
    private zone: NgZone,
    @Inject(DOCUMENT) private document: Document) {

    this.settingsSubscription = this.settingsService.getSettingsObserver().subscribe({
      next: (newSettings) => { this.settings = newSettings },
      error: (e) => this.log.error('Settings Subscription got:' + e, this.id),
      complete: () => this.log.info('Settings Subscription complete', this.id)
    })

    this.rangersSubscription = rangerService.getRangersObserver().subscribe({
      next: (newRangers) => { this.rangers = newRangers },
      error: (e) => this.log.error('Rangers Subscription got:' + e, this.id),
      complete: () => this.log.info('Rangers Subscription complete', this.id)
    })

    // TODO: Use Alert Service to avoid passing along doc & snackbar properties!!!!
    this.alert = new AlertsComponent(this._snackBar, this.log, this.settingsService, this.document)

    // NOTE: workaround for onChange not working...
    this.callsignCtrl.valueChanges.pipe(debounceTime(700)).subscribe(newCall => this.callsignChanged(newCall))

    if (this.rangers.length < 1) {
      this.alert.Banner('Welcome! First load your rangers - at the bottom of the Rangers page.', 'Go to Rangers page', 'Ignore')
      //this.alert.OpenSnackBar(`No Rangers exist. Please go to Advance section at bottom of Ranger page!`, `No Rangers yet exist.`, 2000)
      //TODO: Force navigation to /Rangers?
    }

    // https://material.angular.io/components/autocomplete/examples#autocomplete-overview; also Ang Dev with TS, pg 140ff
    this.filteredRangers = this.callsignCtrl.valueChanges.pipe(
      startWith(''),
      map(callsign => (callsign ? this._filterRangers(callsign) : this.rangers.slice())),
    )
    log.verbose(`constructor: got new callsign: [does endless loop:] {JSON.stringify(this.filteredRangers)}`, this.id)

    // OLD:  map(ranger => (ranger ? this._filterRangers(ranger) : this.rangers.slice())),
    // NEW: map(callsign => (callsign ? this._filterRangers(callsign) : this.rangers.slice())),
  }

  onNewLocationParent(newLocation: LocationType) {
    // Based on listing 8.8 in TS dev w/ TS, pg 188
    this.log.verbose(`Parent got new location: ${newLocation.lat}, ${newLocation.lng} or ${newLocation.address}`, this.id)
    //From Entry Form - Parent got new location: {"lat":47.4472,"lng":-122.4627,"address":""}

    // Children (with @Input stmts - i.e., mini-map) automatically gets the updated location
    this.location = newLocation

    // REVIEW: patch entryForm object - as THAT is what gets saved with on form submit
    this.entryDetailsForm.patchValue({
      locationFrmGrp: newLocation
    })
  }

  onNewTime(newTimeEvent: any) {
    // Based on listing 8.8 in TS dev w/ TS, pg 188
    this.log.verbose(`FORMATTING OF NEW TIME!!!!! Got new time: ${JSON.stringify(newTimeEvent)} +++++++++++++++++++++++++++++++++++++++++`, this.id)
    this.time = JSON.parse(newTimeEvent)
    this.entryDetailsForm.patchValue({ timepickerFormControl: JSON.parse(newTimeEvent) })

    // This then automatically gets sent to mini-map children via their @Input statements
    // TODO: Might we need to update the form itself, so 'submit' captures it properly?
    // TODO: BUT, we still need to update our local copy:
    //this.timepickerFormControl is where the Event comes up from...
  }

  ngOnInit(): void {
    this.log.info(`EntryForm initialization with development mode ${isDevMode() ? "" : "NOT "}enabled`, this.id)
    this.log.verbose("EntryComponent - ngOnInit - Use settings to fill form", this.id)

    // https://angular.io/api/router/Resolve - following fails as SettingsComponent has yet to run...
    // or even https://stackoverflow.com/questions/35655361/angular2-how-to-load-data-before-rendering-the-component
    this.log.info(`Running ${this.settings?.application} version ${this.settings?.version}`, this.id)  // verifies Settings has been loaded

    /* i.e., entryDetailsForm probably constructed at wrong time?!
    Move the component creation to ngOnInit hook
    error can show up when you are working with ViewChild, and execute code in AfterViewInit.
    https://flexiple.com/angular/expressionchangedafterithasbeencheckederror/
    the binding expression changes after being checked by Angular during the change detection cycle

Error: NG0100: ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked. Previous value: 'null'. Current value: '{
 "id": -1,
 "callsign": "",
 "team": "T1",
 [...]
 */
    this.initEntryForm()
    // subscribe to addresses value changes?  NO. It bubles up through newLocATION INSTEAD!!!
    // this.entryDetailsForm.controls['locationFrmGrp'].valueChanges.subscribe(x => {
    //   this.log.verbose(`Subscription to locationFrmGrp got: ${x}`, this.id);
    // })

    this.submitInfo = this.document.getElementById("enter__Submit-info")

    if (this.settings?.debugMode) {
      this.displayShow("enter__frm-reguritation")
    }

    this.callsignCtrl.valueChanges.pipe(debounceTime(700)).subscribe(newCall => this.callsignChanged(newCall))

    // https://angular.io/guide/practical-observable-usage#type-ahead-suggestions

    this.log.verbose(` ngOnInit completed`, this.id)
  }

  ngAfterViewInit() {
    // OK to register for form events here
  }

  initLocation() { // TODO: Shouldn't this be in location.component.ts?!
    // BUG: duplicate of locationFrmGrp creation in EntryComponent.ts
    if (!this.settings) {
      this.log.error(`this.settings was null in initLocation`, this.id)
      return
    }
    this.locationFrmGrp = this._formBuilder.group({
      lat: [this.settings.defLat],
      lng: [this.settings.defLng],
      address: [''] //, Validators.required],
    })

    // Following is unsed!!
    // BUG: Why is this new TIME activity in LOCATION function!!!
    // BUG: Duplicated in time-picker.component - as locationFrmGrp is there...
    // new values here bubble up as emitted events - see onNewLocation()
    // this.timepickerFormControl = this._formBuilder.control(
    //   new Date()
    // ) // TODO: Don't need new!

    /*
    this.locationFrmGrp.valueChanges.pipe(debounceTime(500)).subscribe(locationFrmGrp => this.locationChanged_noLongerNeeded(locationFrmGrp))
    let addr = this.locationFrmGrp.get("address")
    if (addr) {
      addr.valueChanges.pipe(debounceTime(500)).subscribe(locationFrmGrp => this.locationChanged_noLongerNeeded(locationFrmGrp))
      this.log.verbose("Made reservations!", this.id)
    } else {
      console.warn("could NOT Make reservations")
    }
    this.locationFrmGrp.valueChanges.pipe(debounceTime(500)).subscribe(locationFrmGrp => this.locationChanged_noLongerNeeded(locationFrmGrp))
    return this.locationFrmGrp
    */
  }

  private _filterRangers(value: string): RangerType[] {
    this.log.verbose(`_filterRangers  value changed: ${value}`, this.id)

    const filterValue = value.toLowerCase()
    this.entryDetailsForm.value.callsign = filterValue
    return this.rangers.filter((ranger1) => ranger1.callsign.toLowerCase().includes(filterValue))
    /* NEW:
      this.entryDetailsForm.value.callsign = filterValue
      return this.rangers.filter((ranger1) => ranger1.callsign.toLowerCase().includes(filterValue))
    */
    /* OLD:
      this.entryDetailsForm.controls['ranger'].setValue(filterValue) // TODO: MAT input field not automatically set into entryForm
      return this.rangers.filter(ranger => ranger.callsign.toLowerCase().includes(filterValue));
    */
  }

  /**
   * Transforms Settings Array into Form Array
   */
  initEntryForm() {
    if (!this.settings) {
      this.log.error(`this.settings was null in initEntryForm`, this.id)
      return
    }

    this.entryDetailsForm = this._formBuilder.group({
      // matches html's FormControlName="whatever"
      id: -1,
      callsign: [''],
      // team: ['T1'],
      locationFrmGrp: this.initLocation(),
      timepickerFormControl: [new Date()],
      status: [this.settings.fieldReportStatuses[this.settings.defFieldReportStatus].status],
      notes: ['']
    })
  }

  /**
   * Reinitializes Form Array values - without recrating a new object
   */
  // this.myReactiveForm.reset(this.myReactiveForm.value)
  // https://angular.io/guide/reactive-forms#!#_reset_-the-form-flags
  // https://stackoverflow.com/a/54048660
  resetEntryForm() {
    if (!this.settings) {
      this.log.error(`this.settings was null in initEntryForm`, this.id)
      return
    }
    this.log.verbose("Resetting form...", this.id)
    this.entryDetailsForm.reset() // this clears flags on the model like touched, dirty, etc.

    // this.entryDetailsForm = this._formBuilder.group({ // OLD: don't recreate the object!!
    // NOTE: Use patchValue to update just a few
    this.entryDetailsForm.setValue({
      id: -2,
      callsign: [''],
      //team: ['T0'],
      location: this.initLocation(),
      date: [new Date()],  // TODO: reset dateCtrl instead?!
      status: [this.settings.fieldReportStatuses[this.settings.defFieldReportStatus]],
      note: ['']
    })
    // Allow getting new OnChangeUpdates - or use the subscription?!
    //this.entryDetailsForm.markAsPristine();
    //this.entryDetailsForm.markAsUntouched();
  }

  // TODO: NOt working yet...
  callsignChanged(callsign: string) { // Just serves timer for input field - post interaction
    this.log.verbose(`EntryForm CallsignChanged()`, this.id)

    this.callInfo = this.document.getElementById("enter__Callsign-upshot")
    if (this.callInfo) {
      this.log.verbose(`EntryForm CallsignChanged looking for ${callsign}`, this.id)
      //let ranger = this.rangers[this.findIndex(callsign)]
      let ranger = this.rangerService.getRanger(callsign)  // REVIEW is this.rangers here & service in sync?
      this.callInfo.innerHTML = `<span>${ranger.callsign} </span> | <small> ${ranger.licensee} | ${ranger.phone}</small > `
      //< img class= "enter__Callsign-img" aria-hidden src = "${ranger.image}" height = "50" >
    } else {
      this.log.warn(`EntryForm CallsignChanged did not find enter__Callsign-upshot`, this.id)
    }
  }

  callsignCtrlChanged() { // NOTE: NEVER CALLED (my error, maybe does now..)!!!, so use workaround above...
    this.log.error(`callsignCtrlChanged() called!!!!!!!!!!!!!!!!!!`, this.id)
    return
    let callSign: string = (this.document.getElementById("enter__Callsign-input") as HTMLInputElement).value
    if (callSign) {
      this.log.verbose(`CallsignCtrlChanged() call= ${callSign}`)
      this.callsignChanged(callSign)
    }

    // TODO: update #enter__Callsign-upshot
  }

  /*
    Ideas for resetting fade: after Submit button, fade the entry details
    https://www.sitepoint.com/css3-animation-javascript-event-handlers/
    https://css-tricks.com/controlling-css-animations-transitions-javascript/
    https://www.smashingmagazine.com/2013/04/css3-transitions-thank-god-specification/#a2
    https://stackoverflow.com/questions/6268508/restart-animation-in-css3-any-better-way-than-removing-the-element
    https://css-tricks.com/restart-css-animation/
    https://gist.github.com/paulirish/5d52fb081b3570c81e3a
  */
  resetMaterialFadeAnimation(element: HTMLElement) {
    this.log.verbose(`Fade Animation reset`, this.id)
    element.style.animation = 'none';
    element.offsetHeight; // trigger reflow
    element.style.animation = "";
  }

  onFormSubmit(formData1: string): void {
    this.log.verbose(`Submit Form`, this.id)
    //this.date=this.dateCtrl.value // TODO:
    this.entryDetailsForm.value.date = this.dateCtrl.value
    let formData = JSON.stringify(this.entryDetailsForm.value)

    let newReport = this.fieldReportService.addfieldReport(formData)
    this.log.info(`Report id # ${newReport.id} has been added with: ${formData} `, this.id)

    if (this.submitInfo) {
      // Display fading confirmation to right of Submit button
      this.submitInfo.innerText = `Entry id # ${newReport.id} Saved. ${formData}`
      this.resetMaterialFadeAnimation(this.submitInfo)
    }
    else {
      this.log.error("Submit Info field not found. Could not display report confirmation confirmation", this.id)
    }
    this.alert.OpenSnackBar(`Entry id # ${newReport.id} Saved: ${formData}`, `Entry id # ${newReport.id}`, 2000)

    this.resetEntryForm()  // std reset just blanks values, doesn't initialize them...
  }

  /* FUTURE: Allow keywords, or search Notes for semicolon delimited tokens?
  get keywordsControls(): any {
  return (<FormArray>this.entryDetailsForm.get('keywords')).controls
  }   */

  // ---------------- MISC HELPERS -----------------------------
  displayHide(htmlElementID: string) {
    let e = this.document.getElementById(htmlElementID)
    if (e) {
      e.style.visibility = "hidden";
    }
  }

  displayShow(htmlElementID: string) {
    let e = this.document.getElementById(htmlElementID)
    if (e) {
      e.style.visibility = "visible";
    }
  }

  ngOnDestroy() {
    this.locationSubscription.unsubscribe()
    this.rangersSubscription.unsubscribe()
    this.settingsSubscription.unsubscribe()
    this.timeSubscription.unsubscribe()
  }
}
