import { DOCUMENT } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ThemePalette } from '@angular/material/core';
import dayjs from 'dayjs';
import { Observable, debounceTime, map, startWith, switchMap, subscribeOn, Subscription } from 'rxjs'
import { FieldReportService, FieldReportStatusType, RangerService, LogService, RangerType, SettingsService, SettingsType, LocationType } from '../services/'
import { NgxMatDatetimePickerModule, NgxMatNativeDateModule, NgxMatTimepickerModule } from '@angular-material-components/datetime-picker' // already in app.module.ts

@Component({
  selector: 'rangertrak-time-picker',
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.scss']
})
export class TimePickerComponent implements OnInit {
  @Input() public timepickerFormGroup: FormGroup // input from entry.component.ts
  //  @Input() public timepickerFormControl: FormControl // input from entry.component.ts
  //@Input() public timepickerFormControl: FormControl // input from entry.component.ts
  @Output() newTimeEvent = new EventEmitter<Date>()
  // ! @ViewChild('timePicker') timePicker: any; // https://blog.angular-university.io/angular-viewchild/

  private id = "DateTime Picker"

  // https://github.com/angular/components/issues/5648
  // https://ng-matero.github.io/extensions/components/datetimepicker/overview (nice)
  // https://vlio20.github.io/angular-datepicker/timeInline (unused)
  // https://h2qutc.github.io/angular-material-components - IN USE HERE!
  public date: dayjs.Dayjs = dayjs()


  /*  It looks like you're using the disabled attribute with a reactive form directive.
   If you set disabled to true when you set up this control in your component class,
   the disabled attribute will actually be set in the DOM for
    you. We recommend using this approach to avoid 'changed after checked' errors.

    Example:
    form = new FormGroup({
      first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),
      last: new FormControl('Drew', Validators.required)
    });
  */
  public time!: Date
  public disabled = false;
  public showSpinners = true;
  public showSeconds = false; // only affects display in timePicker
  public touchUi = false;
  public enableMeridian = false; // 24 hr clock

  minDate!: dayjs.Dayjs | null
  maxDate!: dayjs.Dayjs | null
  public stepHour = 1;
  public stepMinute = 1;
  public stepSecond = 1;
  public color: ThemePalette = 'primary';
  disableMinute = false
  hideTime = false
  //dateCtrl = new FormControl(new Date()) //TODO: Still need to grab the result during submit...!


  constructor(
    private log: LogService,
    private _formBuilder: FormBuilder,
    @Inject(DOCUMENT) private document: Document) {
    this.log.info(`timepicker construction`, this.id)

    // BUG: maybe should be in EntryComponent.ts instead? as locationFrmGrp is there...
    // new values here bubble up as emitted events - see onNewLocation()

    // formControlName must be used with a parent formGroup directive
    //    this.timepickerFormControl = this._formBuilder.control([this.time])

    this.timepickerFormGroup = this._formBuilder.group({
      time: [this.time]
    })

    // REVIEW: Min/Max times ignored?!
    // TODO: These should get passed in
    this._setMinDate(10) // no times early than 10 hours ago
    this._setMaxDate(1)  // no times later than 1 hours from now

    this.timepickerFormGroup = _formBuilder.group({
      time: [new Date()]
    })
  }

  ngOnInit(): void {
    this.date = dayjs()
  }

  onNewTime(newTime: Date) {
    // Do any needed sanity/validation here
    // Based on listing 8.8 in TS dev w/ TS, pg 188
    // todo : validate min/max time?
    this.log.verbose(`Got new time: ${newTime}. Emitting!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`, this.id)
    this.time = newTime
    //if (! (
    this.newTimeEvent.emit(this.time)
    //) {
    // this.log.warn(`New time event had no listeners!`, this.id) }
    // REVIEW: Let parent update the form fields & other data as necessary...
    //this.timeFrmGrp
  }

  toggleMinDate(evt: any) {
    if (evt.checked) {
      this._setMinDate();
    } else {
      this.minDate = null;
    }
  }

  toggleMaxDate(evt: any) {
    if (evt.checked) {
      this._setMaxDate();
    } else {
      this.maxDate = null;
    }
  }

  // closePicker() {
  //   this timePicker.cancel();
  // }

  private _setMinDate(hours: number = 10) {
    const now = dayjs();
    this.minDate = now.subtract(hours, 'hours');
  }

  private _setMaxDate(hours: number = 10) {
    const now = dayjs();
    this.maxDate = now.add(hours, 'hours');
  }
}
