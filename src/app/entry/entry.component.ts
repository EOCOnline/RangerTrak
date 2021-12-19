import { Component, Inject, OnInit, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs';
import { DOCUMENT, JsonPipe } from '@angular/common';
import { startWith, debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { FormControl, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar';
import { RangerService, RangerType, FieldReportService, FieldReportStatuses, TeamService, TeamType } from '../shared/services/';
import { SettingsComponent } from '../settings/settings.component';


 export interface RangerTypeJunk {
  callsign: string
  licensee: string
  //licenseKey: number
  phone: string
  //address: string
  image: string
  team: string
  //icon: string
  //status: string
  //note: string
}

@Component({
  selector: 'rangertrak-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.scss'],
  providers: [RangerService, FieldReportService, TeamService]
})

export class EntryComponent implements OnInit, AfterViewInit {

  // BUG: Following is a dupl of FieldReportStatuses
  public fieldReportStatus = ['None', 'Normal', 'Need Rest', 'Urgent', 'Objective Update', 'Check-in', 'Check-out']  // TODO: Allow changing list & default of statuses in settings?!

  callsignCtrl = new FormControl()
  filteredRangers:Observable<RangerType[]> //| null

  rangers: RangerType[] = []
  teams: TeamType[]   // TODO: Now what to do with the list of Teams?!!!
  fieldReportService

  setting = SettingsComponent.AppSettings

  entryDetailsForm!: FormGroup;


  constructor(
    private fb: FormBuilder,
    private _snackBar: MatSnackBar,
    rangerService: RangerService,
    fieldReportService: FieldReportService,
    teamService: TeamService,
    @Inject(DOCUMENT) private document: Document) {   //, private service: PostService) {

    // REVIEW: Or should this be done in ngOnInit()?
    this.rangers = rangerService.getRangers() // TODO: or getActiveRangers?!
    this.fieldReportService = fieldReportService
    this.teams = teamService.getTeams()

    // https://material.angular.io/components/autocomplete/examples#autocomplete-overview

    this.filteredRangers = this.callsignCtrl.valueChanges.pipe(
      startWith(''),
      map(ranger => (ranger ? this._filterRangers(ranger) : this.rangers.slice())),
    );
  }


  private _filterRangers(value: string): RangerType[] {
    const filterValue = value.toLowerCase();

    this.entryDetailsForm.controls['ranger'].setValue(filterValue) // TODO: MAT input field not automatically set into entryForm

    return this.rangers.filter(ranger => ranger.callsign.toLowerCase().includes(filterValue));
  }


  ngOnInit(): void {
    console.log("EntryForm test started at ", Date())

    this.entryDetailsForm = this.fb.group({
      callsign: ['KE7KQ'],  // TODO: Not tied to the material design input field...
      team: ['T2'],
      whereFormModel: this.fb.group({
        address: ['default location (original)'],
        lat: [this.setting.DEF_LAT,
        Validators.required,
        //Validators.minLength(4)
        ],
        long: [this.setting.DEF_LONG,
        Validators.required,
        //Validators.minLength(4)
        ]
      }),
      whenFormModel: this.fb.group({
        date: [new Date()]
      }),
      whatFormModel: this.fb.group({
        status: [this.fieldReportStatus[0]],   // TODO: Allow changing list & default of statuses in settings?!
        notes: ['']
      })
    })


    //console.log(JSON.stringify(this.teams))
    console.log("EntryForm test completed at ", Date())
  }

  /*
    FUTURE: Allow entry of keywords
    get keywordsControls(): any {
    return (<FormArray>this.entryDetailsForm.get('keywords')).controls;
  }   */

  openSnackBar(message: string, action: string, duration = 0) {
    this._snackBar.open(message, action, { duration: duration })
  }

  // TODO: This also gets called if the Update Location button is clicked!!
  onFormSubmit(): void {

    let formData = JSON.stringify(this.entryDetailsForm.value)

    console.log(formData)
    this.openSnackBar('Entry Saved: ' + formData, 'Nice!', 5000)


    this.fieldReportService.pushFieldReport(formData)
    // TODO: Add to FieldReports.. Call api post service here

    this.resetForm()

  }

  // TODO: Reset form: Callsign to blank, current date, status/notes
  resetForm() {
    console.log("Resetting form...")


    this.entryDetailsForm = this.fb.group({
      callsign: [''],  // TODO: Not tied to the material design input field...
      team: ['T3'],
      whereFormModel: this.fb.group({
        address: ['default location (reset)'],
        lat: [this.setting.DEF_LAT,
        Validators.required,
        //Validators.minLength(4)
        ],
        long: [this.setting.DEF_LONG,
        Validators.required,
        //Validators.minLength(4)
        ]
      }),
      whenFormModel: this.fb.group({
        date: [new Date()]
      }),
      whatFormModel: this.fb.group({
        status: [this.fieldReportStatus[0]],   // TODO: Allow changing list & default of statuses in settings?!
        notes: ['']
      })
    })


    // BUG: none of the following work...
    //this.document.getElementById("callsign")!.innerText! = ''
    //this.entryDetailsForm.controls['#callsign'].reset
    //this.entryDetailsForm.controls['#callsign'].reset
    //this.entryDetailsForm.controls['#callsign'].setValue('')
    //this.entryDetailsForm.controls['derivedAddress'].setValue('New ddddddddDerived Address')
  }

  updateLocation() {
    //this.entryDetailsForm.get(['', 'name'])
    //this.entryDetailsForm.controls['derivedAddress'].setValue('New Derived Address')

    var addr = this.document.getElementById("derivedAddress")
    addr!.innerHTML = "New What3Words goes here!"
  }

  ngAfterViewInit() {
    //console.log("ngAfterViewInit");
    //console.debug(this.divs);
  }
}
