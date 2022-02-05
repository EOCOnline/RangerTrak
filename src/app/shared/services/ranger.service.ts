import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import { BehaviorSubject, Observable, Observer, of } from 'rxjs';
import { csvImport } from 'src/app/rangers/csvImport';
//import { debounceTime, map, startWith } from 'rxjs/operators'
import * as rangers from '../../../assets/data/Rangers.3Feb22.json'

export interface RangerType {
  callsign: string
  licensee: string
  // licenseKey: number
  phone: string
  address: string
  image: string
  team: string
  icon: string
  status: string
  note: string
}

export enum RangerStatus { '', 'Normal', 'Need Rest', 'REW', 'OnSite', 'Checked-in', 'Checked-out' }  // TODO: Allow changing list & default of statuses in settings?!


/* Following gets:
index.js:553 [webpack-dev-server] WARNING
D:\Projects\RangerTrak\rangertrak\src\app\log\log.component.ts depends on 'xlsx'. CommonJS or AMD dependencies can cause optimization bailouts.
For more info see: https://angular.io/guide/build#configuring-commonjs-dependencies */
import * as XLSX from 'xlsx';

/* xlsx.js (C) 2013-present SheetJS -- http://sheetjs.com */
// https://github.com/SheetJS/SheetJS.github.io
// D:\Projects\ImportExcel\sheetjs-master\demos\angular2\src\app\sheetjs.component.ts
type AOA = any[][]  // array of arrays


@Injectable({ providedIn: 'root' })
export class RangerService {
  observRangers$: Observable<RangerType[]> | null = null

  rangers: RangerType[] = []
  //  rangers2: RangerType[] = []
  private nextId = 0
  private rangersSubject =
    new BehaviorSubject<RangerType[]>([]);  // REVIEW: Necessary?
  private localStorageRangerName = 'rangers'
  excelData: any[][] = [[1, 2, 3], [4, 5, 6]];

  constructor(private httpClient: HttpClient) {
    console.log("Rangers Service Construction")
    this.LoadRangersFromLocalStorage()
    console.log(`Got ${this.rangers.length} from Local Storage`)

    if (this.rangers.length == 0) {
      //this.LoadRangersFromJSON() // Have user use button to initiate this
      //Better to load hardcoded folks...
      this.loadHardcodedRangers()
      console.log(`No Rangers in Local storage, so grabbed ${this.rangers.length} from Rangers.2Feb22.json file.`)
    }

    // Needed? Maybe to expose observable?
    this.UpdateLocalStorage()
  }

  GetRangers() {
    console.log(`GetRangers() returning ${this.rangers.length} Rangers`)
    this.SortRangersByCallsign()
    return this.rangers
  }

  subscribe(observer: Observer<RangerType[]>) {
    this.rangersSubject.subscribe(observer);
  }

  //--------------------------------------------------------------------------
  // Update localStorage with current Rangers data & Publish update for any Observers
  UpdateLocalStorage() {
    console.log(`RangersService: Saving ${this.rangers.length} rangers to local storage`)
    localStorage.setItem(this.localStorageRangerName, JSON.stringify(this.rangers))
    //localStorage.setItem("SpecialRangers", JSON.stringify(this.rangers2))
    //console.log("Updated Rangers to " + JSON.stringify(this.rangers))

    this.SortRangersByCallsign()


    // now gets:
    /*  Error: Uncaught (in promise): TypeError: this.rangers.map is not a function
      TypeError: this.rangers.map is not a function
          at RangerService.UpdateLocalStorage (ranger.service.ts:82:43)
          at new RangerService (ranger.service.ts:60:10)
  */

    // licenseKey: ranger.licenseKey,
    this.rangersSubject.next(this.rangers.map(
      ranger => ({callsign: ranger.callsign,
        licensee: ranger.licensee,
        phone: ranger.phone,
        address: ranger.address,
        image: ranger.image,
        team: ranger.team,
        icon: ranger.icon,
        status: ranger.status,
        note: ranger.note
      })
    ))

  }

  //--------------------------------------------------------------------------
  LoadRangersFromLocalStorage() { // WARN: Replaces any existing Rangers
    let localStorageRangers = localStorage.getItem(this.localStorageRangerName)
    try {
      this.rangers = (localStorageRangers != null) ? JSON.parse(localStorageRangers) : []   //TODO: clean up
      console.log(`RangersService: Loaded ${this.rangers.length} rangers from local storage`)
    } catch (error: any) {
      console.log(`Unable to parse Rangers from Local Storage. Error: ${error.message}`)
    }
    this.SortRangersByCallsign()
  }

  //--------------------------------------------------------------------------
  LoadRangersFromJSON(fileName: string = '../../../assets/data/Rangers.3Feb22.json') {  // WARN: Replaces any existing Rangers
    console.log(`RangerService: loading new Rangers from ${fileName}`)

    //debugger

    // also see secretss import as an example: Settings.ts

    this.observRangers$ = this.httpClient.get<RangerType[]>(fileName) // from pg 281

    //this.rangers = []
    if (rangers != null) {
      // Use JSON file imported at the top
      // this.rangers = JSON.parse(rangers) || []
      // this.rangers = rangers
      /* TODO: Add missing fields:
      Type '{ callsign: string; label: string; licensee: string; licenseKey: string; phone: string; team: string; icon: string; }[]' is not assignable to type 'RangerType[]'.

      Type '{ callsign: string; label: string; licensee: string; licenseKey: string; phone: string; team: string; icon: string; }is missing the following properties from type
      'RangerType': address, image, status, notets(2322)

      */
    }

    // REVIEW: Workaround for "Error: Should not import the named export (imported as 'rangers') from default-exporting module (only default export is available soon)"
    let rangerWorkaround = JSON.stringify(rangers)
    this.rangers = JSON.parse(rangerWorkaround)
    this.SortRangersByCallsign()
    console.log(`Got ${this.rangers.length} rangers from JSON file.`)
  }

  //See pg. 279...
  //import * as data from filename;
  //let greeting = data.greeting;
  /*   import {default as AAA} from "VashonCallSigns";
        AAA.targetKey
        // this requires `"resolveJsonModule": true` in tsconfig.json

        import {default as yyy} from './Rangers.3Feb22.json'
import { HttpClient } from '@angular/common/http';
        yyy.primaryMain


    ngOnInit(): void {

            this.myService.getResponseData().then((value) => {
                //SUCCESS
                console.log(value);
                this.detailsdata = value;

            }, (error) => {
                //FAILURE
                console.log(error);
            })
        }

    <p><b>sales amount:</b> {{ detailsdata?.sales_amount }}</p>
    <p><b>collection amount:</b> {{ detailsdata?.collection_amount }}</p>
    <p><b>carts amount:</b> {{ detailsdata?.carts_amount }}</p>

    */

  //--------------------------------------------------------------------------
  // https://ag-grid.com/javascript-data-grid/excel-import/#example-excel-import"
  // https://github.com/SheetJS/SheetJS/tree/master/demos/angular2/
  LoadRangersFromExcel(eventTarget: any) {  // HTMLInputElement event:target

    type AOR = RangerType[]  // array of Rangers

    // wire up file reader
    const target: DataTransfer = <DataTransfer>(eventTarget);

    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
    console.log(`LoadRangersFromExcel(): About to read contents of ${target.files[0].name}`)
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {

      // read workbook
      const ab: ArrayBuffer = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(ab);

      // grab first sheet
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      // debugger

      let myJson = JSON.stringify(XLSX.utils.sheet_to_json(ws, { header: 1 }))

      console.log(`myJson = ${myJson}`)
      let myJson2 = JSON.parse(myJson)
      console.log(`myJson2 = ${myJson2}`)
      console.log(`1 Got ${this.rangers.length} rangers from Excel file.`)

      // save data
      this.rangers = <AOR>(myJson2)
      console.log(`2 Got ${this.rangers.length} rangers from Excel file...`)

      //this.rangers = JSON.parse(myJson)
    };
    console.log(`3 Got ${this.rangers.length} rangers from Excel file.`)

    this.DisplayRangers(`Excel import from ${target.files[0].name}`)
    console.log(`4 Got ${this.rangers.length} rangers from Excel file.`)

    reader.readAsArrayBuffer(target.files[0]);

    console.log(`5 Got ${this.rangers.length} rangers from Excel file.`)
    this.SortRangersByCallsign()

    // this.UpdateLocalStorage
    return this.rangers
  }

  //--------------------------------------------------------------------------
  DisplayRangers(msg: string) {
    let len = 10
    if (this.rangers.length < len) len = this.rangers.length
    console.log(`${msg}: (1st ${len} rows:)`)
    for (let i = 0; i < len; i++) {
      console.log(`${i} as $$: ${JSON.stringify(this.rangers[i])}`)
      //console.log(`${i} as $$: ${JSON.stringify(this.rangers[i])}`)
    }
  }

  //--------------------------------------------------------------------------
  LoadRangersFromExcel2() {
    //debugger
    let fnc = new csvImport(document)
    fnc.importExcel2()
    //csvImport.importExcel2()
    console.log(`Got excel file`)
  }


  //--------------------------------------------------------------------------
  getRanger(callsign: string) {
    const index = this.findIndex(callsign);
    return this.rangers[index];
  }

  updateRanger(ranger: RangerType) {
    const index = this.findIndex(ranger.callsign);
    this.rangers[index] = ranger;
    this.UpdateLocalStorage();
  }

  deleteRanger(callsign: string) {
    const index = this.findIndex(callsign);
    this.rangers.splice(index, 1);
    this.UpdateLocalStorage();
  }

  // TODO: verify new report is proper shape/validated here or by caller??? Send as string or object?
  AddRanger(formData: string = ""): RangerType {
    console.log(`RangerService: Got new ranger: ${formData}`)
    let newRanger: RangerType
    if (formData != "") {
      newRanger = JSON.parse(formData)
    } else {
      newRanger = {callsign: "AAA_New_Tactical", licensee: "AAA_New_Name",        // licenseKey: number
        image: "  ", phone: "206-463-0000", address: "St, Vashon, WA 98070", team: "", icon: "", status: "", note: `Manually added at ${formatDate(Date.now(), 'short', "en-US")}.` //https://angular.io/guide/i18n-common-locale-id
      }
    }
    this.rangers.push(newRanger)

    this.UpdateLocalStorage();
    return newRanger;
  }

  private findIndex(callsign: string): number {
    for (let i = 0; i < this.rangers.length; i++) {
      if (this.rangers[i].callsign === callsign) return i;
    }
    throw new Error(`Ranger with callsign ${callsign} was not found!`);
  }

  //--------------------------------------------------------------------------
  deleteAllRangers() {
    this.rangers = []
    localStorage.removeItem('rangers')
    // localStorage.clear() // remove all localStorage keys & values from the specific domain you are on. Javascript is unable to get localStorage values from any other domains due to CORS
  }

  // this needs be done for the autocomplete control in the enter comonent to work correctly
  SortRangersByCallsign() {
    console.log(`SortRangersByCallsign: ${this.rangers.length} Rangers in array`)

    return this.rangers.sort((n1, n2) => {
      if (n1.callsign > n2.callsign) { return 1 }
      if (n1.callsign < n2.callsign) { return -1 }
      return 0;
    })
  }



  SortRangersByCallsign_unused() {
    console.log(`SortRangersByCallsign: ${this.rangers.length} Rangers in array`)

    //debugger
    //return this.rangers

    if (this.rangers.length == 0) {
      return
    }

    //let sorted4 = this.rangers

    this.rangers.sort((a, b) => {
      if (b.callsign > a.callsign) return -1
      if (b.callsign < a.callsign) return 1
      return 0
    })
    /*
        let sorted = this.rangers.sort((first, second) => first.callsign > second.callsign ? 1 : -1)
        //let sorted = this.rangers.sort((first, second) => {first.callsign > second.callsign ? 1 : -1})
         // reversed from A & B above!
         sorted4.sort((first, second) => {
          if (first.callsign > second.callsign)  {return 1 }
          if (first.callsign < second.callsign)  {return -1 }
          return 0
        })
    */
    console.log("SortRangersByCallsign...DONE")
    return this.rangers
  }

  //--------------------------------------------------------------------------
  loadHardcodedRangers() {
    console.log("Adding all hardcoded Rangers")

    /* Following from 98070 AND 98013 zip codes, MUST be sorted by call sign!
        https://wireless2.fcc.gov/UlsApp/UlsSearch/searchAmateur.jsp
  */

    /* TODO: Implement better fake data and pay attention to the number to create...
    let teams = this.teamService.getTeams()
    let rangers = this.rangerService.getRangers()
    let streets = ["Ave", "St.", "Pl.", "Court", "Circle"]
    let notes = ["Reports beautiful sunrise", "Roudy Kids", "Approaching Neighborhood CERT", "Confused & dazed in the sun",                "Wow", "na", "Can't hear you", "Bounced via tail of a comet!", "Need confidential meeting: HIPAA", "Getting overrun by racoons"]

        for (let i = 0; i < num; i++) {
      array.push({
         callsign: rangers[Math.floor(Math.random() * rangers.length)].callsign,
         team: teams[Math.floor(Math.random() * teams.length)].name
         address: (Math.floor(Math.random() * 10000)) + " SW " + streets[(Math.floor(Math.random() * streets.length))],
        */

    this.rangers.push(

      {callsign: "!Team1", licensee: "ACS-CERT Team 1", phone: "206-463-", address: "Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "T1", icon: " ", status: "Licensed", note: "-"},
      {callsign: "!Team2", licensee: "ACS-CERT Team 2", phone: "206-463-", address: "Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "T1", icon: " ", status: "Licensed", note: "-"},
      {callsign: "!Team3", licensee: "ACS-CERT Team 3", phone: "206-463-", address: "Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "T1", icon: " ", status: "Licensed", note: "-"},
      {callsign: "!Team4", licensee: "ACS-CERT Team 4", phone: "206-463-", address: "Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "T1", icon: " ", status: "Licensed", note: "-"},


      {callsign: "CERT1", licensee: "CERT 1", phone: "206-463-", address: "Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "T1", icon: " ", status: "Licensed", note: "-"},
      {callsign: "CERT2", licensee: "CERT 2", phone: "206-463-", address: "Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "T1", icon: " ", status: "Licensed", note: "-"},
      {callsign: "CERT3", licensee: "CERT 3", phone: "206-463-", address: "Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "T1", icon: " ", status: "Licensed", note: "-"},
      {callsign: "CERT4", licensee: "CERT 4", phone: "206-463-", address: "Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "T1", icon: " ", status: "Licensed", note: "-"},

      {callsign: "REW1", licensee: "REW 1", phone: "206-463-", address: "Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "T1", icon: " ", status: "Licensed", note: "-"},
      {callsign: "REW2", licensee: "REW 2", phone: "206-463-", address: "Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "T1", icon: " ", status: "Licensed", note: "-"},
      {callsign: "REW3", licensee: "REW 3", phone: "206-463-", address: "Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "T1", icon: " ", status: "Licensed", note: "-"},
      {callsign: "REW4", licensee: "REW 4", phone: "206-463-", address: "Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "T1", icon: " ", status: "Licensed", note: "-"},


      {callsign: "AH6B", licensee: "Pine, Douglas E", phone: "206-463-", address: "9700 Sw 285Th St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "AJ7T", licensee: "Pinter, Robert B", phone: "206-463-", address: "12203 Sw 153Rd St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "AK7C", licensee: "Mcdonald, Michael E", phone: "206-463-", address: "24107 Wax Orchard Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "K7NHV", licensee: "Francisco, Albert K", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "K7VJJ", licensee: "Gleason, Keith H", phone: "206-463-", address: "11423 99Th Ave, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KA2QLV", licensee: "Paull, Steven", phone: "206-463-", address: "11610 Sw 220Th St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KA7DGV", licensee: "Hardy, Timothy R", phone: "206-463-", address: "29715 128Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KA7GDT", licensee: "White, Victor S", phone: "206-463-", address: "15314 Vermontville, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KA7IXC", licensee: "Carr, David W", phone: "206-463-", address: "Rt 1 Box 244, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KA7THJ", licensee: "Hanson, Jay R", phone: "206-463-", address: "12424 Sw Cove Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KB0LJC", licensee: "Hirsch, Justin D", phone: "206-463-", address: "10518 Sw 132Nd Pl, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KB7AOK", licensee: "Perena, Jose K", phone: "206-463-", address: "21226 Tramp Harbor Drive Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KB7DQG", licensee: "Ammon, Paul G", phone: "206-463-", address: "Rt 1 Box 1142, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KB7DQI", licensee: "Gleb, Phillip L", phone: "206-463-", address: "R 3 B 427, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KB7EIF", licensee: "Ammon, Virginia M", phone: "206-463-", address: "Rt 1 Box 1142, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KB7IHS", licensee: "Gregory, Arthur J", phone: "206-463-", address: "Rt 3 Box 279, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KB7IMA", licensee: "Fultz, Howard T", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KB7NDW", licensee: "Hacker, Richard M", phone: "206-463-", address: "25407 Wax Orchard Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KB7OXU", licensee: "Weir, Janet J", phone: "206-463-", address: "8115 Sw Klahanie Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KB7OXV", licensee: "Weir, Robert D", phone: "206-463-", address: "8115 Sw Klahanie Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KB7QFF", licensee: "Lindgren, Clifford W", phone: "206-463-", address: "27405 99Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KB7YYM", licensee: "Mermoud Babbott, Leslie R", phone: "206-463-", address: "8131 Sw Dilworth Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KC2ELS", licensee: "Twilley, John M", phone: "206-463-", address: "10210 Sw 210Th St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KC7AUT", licensee: "Nishiyori, Kenneth W", phone: "206-463-", address: "17520 115Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KC7AUY", licensee: "Blichfeldt, Bent", phone: "206-463-", address: "26620 99Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KC7IXZ", licensee: "Harrigan, Sparky", phone: "206-463-", address: "14609 Bethel Ln Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KC7IYA", licensee: "Carr, Marvin E", phone: "206-463-", address: "8923 Sw Qtrmstr Dr, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KC7JMQ", licensee: "Hardy, Denise L", phone: "206-463-", address: "29715 128Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KC7JOH", licensee: "Ferch, Carol A", phone: "206-463-", address: "10977 Pt Vashon Dr Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KC7ZOX", licensee: "Hanusa, Mark M", phone: "206-463-", address: "23910 51St Ln Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KC7ZOY", licensee: "Carpenter, Mary L", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7AYE", licensee: "Ruzicka, David L", phone: "206-463-", address: "15117 119Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7BUR", licensee: "Hill, Gerald C", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7CEK", licensee: "Hill, Melinda R", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7DQO", licensee: "Silver, Lowell E", phone: "206-463-", address: "22916 107Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7FWQ", licensee: "Hill, Joseph V", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE6OOQ", licensee: "Rockwell, Neil I", phone: "206-463-", address: "12233 Sw Cove Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE6WXA", licensee: "Garrison, Elizabeth B", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7CM", licensee: "Galus, John F", phone: "206-463-", address: "19323 Westside Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7UQ", licensee: "Willsie, Howard D", phone: "206-463-", address: "10977 Pt Vashon Dr Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7MM", licensee: "Babbott Iii, Frank L", phone: "206-463-", address: "8131 Sw Dilworth Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "N6QIV", licensee: "Goard, Carolyn S", phone: "206-463-", address: "10613 Sw 133Rd St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "N6SCM", licensee: "Valencia, Jane K", phone: "206-463-", address: "16917 Vashon Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "N7DZD", licensee: "Vornbrock, John T", phone: "206-463-", address: "13617 Sw 235 St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "N7EUL", licensee: "Konecki, John T", phone: "206-463-", address: "17904 Westside Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "N7KOC", licensee: "Gee, E Howard", phone: "206-463-", address: "Rt 3 Box 287, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "N7MSN", licensee: "Dreisbach, Ezra M", phone: "206-463-", address: "Rt 5 Box 436 Bank Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "N7PAE", licensee: "Tousley, Jeffrey L", phone: "206-463-", address: "11020 Sw 232 St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W5RCO", licensee: "Gregory, John R", phone: "206-463-", address: "11120 Sw Sylvan Beach Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7ATK", licensee: "Benzon, Frank A", phone: "206-463-", address: "10709 Sw 238 St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7AY", licensee: "Cruse, Wilke E", phone: "206-463-", address: "11506 105Th Pl Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7IDF", licensee: "Cole, Edwin K", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7KYI", licensee: "Merrell, Stanton C", phone: "206-463-", address: "24186 Vashon Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7PPA", licensee: "Hickox, Ernest C", phone: "206-463-", address: "6113 Sw 240Th St., Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7TSD", licensee: "Allen, Bruce B", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7WS", licensee: "Williams, Jerry B", phone: "206-463-", address: "22317 Dockton Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "WA6VJQ", licensee: "Garland, Earl E", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "WA7EAW", licensee: "Mc Farlane, Claude L", phone: "206-463-", address: "9127 Sw Bayview Drive, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "WA7HJJ", licensee: "Kellum, Donald F", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "WA7KYI", licensee: "Tharp, James C", phone: "206-463-", address: "9236 Sw 274Th, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "WA7SVS", licensee: "Ball Jr, Lemuel B", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "WB5PSV", licensee: "Bardwell, Randall D", phone: "206-463-", address: "25236 107Th Ave Se, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "WB6RRU", licensee: "Valencia, Andrew J", phone: "206-463-", address: "16245 Westside Hwy, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "WB7FCH", licensee: "Vogel, Keith W", phone: "206-463-", address: "9230 Sw 192Nd St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "WB7QIJ", licensee: "Linden, George M", phone: "206-463-", address: "8768 Sw 190 St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "WB7VKE", licensee: "Sullivan, Timothy X", phone: "206-463-", address: "23515 Kingsbury Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7GMW", licensee: "Hill, Deborah", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD5JYQ", licensee: "Lund, David W", phone: "206-463-", address: "9525 Sw 288Th St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7JWH", licensee: "Kovarik, Krejimir", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7JWI", licensee: "Bajramovic, Nermin", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7JWJ", licensee: "Corsi, Pietro", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "K5CRO", licensee: "Kovarik, Kresimir", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7MUB", licensee: "Clemens, Barry M", phone: "206-463-", address: "10330 Sw Bank Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG6IGC", licensee: "Vashon-Maury Island Radio Club", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7OPX", licensee: "Vashon-Maury Island Radio Club", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7PAZ", licensee: "Miller, Lee A", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7PBA", licensee: "Zook, Phillip D", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7PBB", licensee: "Miller, Joan A", phone: "206-463-", address: "8931 Sw Quartermaster Dr, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7PBC", licensee: "Kremer, Richard H", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7PBD", licensee: "Treese, F Mitch A", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7PBE", licensee: "Loveness, Gary R", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7PBF", licensee: "Loveness, Ghyrn W", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7PBG", licensee: "Sommers, Gayle", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7PFA", licensee: "Frye, Leslie G", phone: "206-463-", address: "22829 107Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7PFB", licensee: "Frye, Richard D", phone: "206-463-", address: "22829 107Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7PMV", licensee: "Lickfelt, Kevin R", phone: "206-463-", address: "9857 Sw 148Th St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7PMW", licensee: "Clemens, Lauren M", phone: "206-463-", address: "10330 Sw Bank Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7PMX", licensee: "Silver, Nancy R", phone: "206-463-", address: "22916 107Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7QAM", licensee: "Richards, John A", phone: "206-463-", address: "9133 Sw 274Th, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7QEX", licensee: "Snow, Brett S", phone: "206-463-", address: "10809 Sw 204Th, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "N7GRL", licensee: "Loveness, Gary R", phone: "206-463-", address: "14122 Sw 220Th Street, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7GWL", licensee: "Loveness, Ghyrn W", phone: "206-463-", address: "14122 Sw 220Th Street, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7CXB", licensee: "Richards, John M", phone: "206-463-", address: "9133 Sw 274Th, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "K3QNQ", licensee: "Treese, F Mitch A", phone: "206-463-", address: "15024 107Th Way Sw Express Mail Only, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7PDZ", licensee: "Zook, Phillip D", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7TRH", licensee: "Hardy, Timothy R", phone: "206-463-", address: "29715 128Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7RWJ", licensee: "Nelson, Jack H", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KU0W", licensee: "Frye, Richard D", phone: "206-463-", address: "22829 107Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7SMI", licensee: "Griswold, James E", phone: "206-463-", address: "5724 Sw 244Th, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7VMI", licensee: "Vashon-Maury Island Radio Club", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7VSA", licensee: "Givotovsky, Alan", phone: "206-463-", address: "23607 49Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7ZOW", licensee: "Tabscott, Robert L", phone: "206-463-", address: "14215 Sw 283Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7ZPH", licensee: "Carson, Polly M", phone: "206-463-", address: "14215 Sw 283Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7ZVK", licensee: "Rollo, Jack W", phone: "206-463-", address: "9733 Sw Harbor Dr, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7ZYJ", licensee: "De Steiguer, Allen L", phone: "206-463-", address: "17615 Mclean Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7AJY", licensee: "Boardman, James H", phone: "206-463-", address: "10619 Sw Cowan Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7AKA", licensee: "Coldeen, Chris A", phone: "206-463-", address: "16103 Westside Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7AKB", licensee: "Turner, Ed", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7AKC", licensee: "Wolczko Dvm, Donald P", phone: "206-463-", address: "8819 S.W. 198Th St., Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ1MBO", licensee: "Boardman, James H", phone: "206-463-", address: "10619 Sw Cowan Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7AWP", licensee: "Tharp, Adam J", phone: "206-463-", address: "9236 Sw 274Th St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7BGK", licensee: "Powell, Robert D", phone: "206-463-", address: "19917 Vashon Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "K7AJT", licensee: "Tharp, Adam J", phone: "206-463-", address: "9236 Sw 274Th St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "N7RDP", licensee: "Powell, Robert D", phone: "206-463-", address: "19917 Vashon Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "K7VMI", licensee: "De Steiguer, Allen L", phone: "206-463-", address: "17615 Mclean Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7DEO", licensee: "Harshman, Clifford E", phone: "206-463-", address: "9522 Sw 268Th Street, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KO7P", licensee: "Pine, Douglas E", phone: "206-463-", address: "9700 Sw 285Th St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7HBX", licensee: "Karusaitis, Rhoda B", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7HBY", licensee: "Cooper, David F", phone: "206-463-", address: "8763 Sw 190Th St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7HBZ", licensee: "Danielson, Sharon J", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7HCA", licensee: "Stanton, John S", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7HCB", licensee: "Bentley, Michael B", phone: "206-463-", address: "17823 Mclean Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7HFF", licensee: "Morse, Marsha E", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7HFG", licensee: "Fitzpatrick, Walton R", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7HFH", licensee: "Kaufer, Tom M", phone: "206-463-", address: "11725 Sw Cedarhurst Dr, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "K6AJV", licensee: "Valencia, Andrew J", phone: "206-463-", address: "16917 Vashon Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7KDQ", licensee: "Cornelison, John", phone: "206-463-", address: "10506 Sw 132Nd Pl, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7KDV", licensee: "Danielson, Richard A", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7LER", licensee: "Brown, Steven A", phone: "206-463-", address: "5213 Sw Point Robinson Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7MTN", licensee: "Schueler, Dan F", phone: "206-463-", address: "21917 131St Pl Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7OTE", licensee: "Way, Steve C", phone: "206-463-", address: "13129 Sw 248Th St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "NH6ZA", licensee: "Pine, Douglas E", phone: "206-463-", address: "4904 Sw Luana Ln, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7RXD", licensee: "Kellogg, Loren B", phone: "206-463-", address: "18223 Vashon Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "K7KMS", licensee: "Paull, Steven", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7VNA", licensee: "Nelson, William C", phone: "206-463-", address: "15655 94Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "K7DGL", licensee: "Luechtefeld, Daniel", phone: "206-463-", address: "9727 Sw Summerhurst Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7YLI", licensee: "Leblanc, Christopher A", phone: "206-463-", address: "26220 99Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KF7CBK", licensee: "Wojcik, Peter A", phone: "206-463-", address: "27436 90Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KF7FDK", licensee: "Joffray, Flynn T", phone: "206-463-", address: "11312 Sw 232Nd St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KF7GPM", licensee: "Van Egmond, Raynier A", phone: "206-463-", address: "10104 Sw 153Rd St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "K7RDB", licensee: "Bardwell, Randall D", phone: "206-463-", address: "12215 Sw Shawnee Road, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KF7JCT", licensee: "Underwood, Robert S", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KF7NCS", licensee: "Staczek, Jason L", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KF7NYC", licensee: "Hamaker, James R", phone: "206-463-", address: "8903 Bayview Dr, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KF7OKQ", licensee: "Wallace, Rick", phone: "206-463-", address: "23817 104Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W0RIK", licensee: "Wallace, Rick", phone: "206-463-", address: "23817 104Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "AE7MW", licensee: "Smueles, Robert E", phone: "206-463-", address: "11909 Sw 232Nd St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KF7QCE", licensee: "Cochrane, Michael L", phone: "206-463-", address: "5313 Sw Pt Robinson Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KF7QCF", licensee: "Durrett, Erin A", phone: "206-463-", address: "6002 Sw Pt Robinson Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KF7QCH", licensee: "Rogers, Catherine A", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KF7QCJ", licensee: "Blichfeldt Cooper, Ulla", phone: "206-463-", address: "8763 Sw 190Th St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KF7QCK", licensee: "Stratton, Rex B", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "AE7SD", licensee: "Danielson, Sharon J", phone: "206-463-", address: "23528 Landers Rd. Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "AE7TH", licensee: "Hardy, Timothy R", phone: "206-463-", address: "29715 128Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "K1SAB", licensee: "Brown, Steven A", phone: "206-463-", address: "5213 Sw Point Robinson Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KF7VDA", licensee: "Galus, Georgia A", phone: "206-463-", address: "19323 Westside Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KF7VVR", licensee: "Ellison-Taylor, John M", phone: "206-463-", address: "29746 128Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KF7WOQ", licensee: "Hyde Iv, James F", phone: "206-463-", address: "6109 Sw Pt Robinson Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7BSE", licensee: "Blackstone, Robert A", phone: "206-463-", address: "4409 Sw Pt Robinson Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7BSF", licensee: "Woods, Melodie", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7BSG", licensee: "Cochrane, Catherine S", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7BSH", licensee: "Edwards, Shelby T", phone: "206-463-", address: "10806 Sw Cemetery Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7BSI", licensee: "Moore, Wanda L", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7BSJ", licensee: "Kennedy Taylor, Alison K", phone: "206-463-", address: "29746 128Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7BSK", licensee: "King, Lori J", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7BSL", licensee: "Lyell, William E", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7BSM", licensee: "Symonds, Penni J", phone: "206-463-", address: "15626 91St Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7BSN", licensee: "Blackstone, Randee C", phone: "206-463-", address: "4409 Sw Pt Robinson Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7BSQ", licensee: "Lyell, Jan R", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7BSR", licensee: "Sussman, Stephen M", phone: "206-463-", address: "15626 91St Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7CFG", licensee: "O'Brien, Truman E", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7CFH", licensee: "Stone, Nancy E", phone: "206-463-", address: "15502 91St Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7CFI", licensee: "Nelson, Mary E", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7CFJ", licensee: "O'Brien, Mary A", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7CFK", licensee: "Hayes, Ira A", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7MCW", licensee: "Woods, Melodie", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7AKT", licensee: "Kennedy Taylor, Alison K", phone: "206-463-", address: "29746 128Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7EQW", licensee: "Lecky, Ned", phone: "206-463-", address: "24427 Wax Orchard Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7JIQ", licensee: "Beles, Lynette B", phone: "206-463-", address: "18823 Robinwood Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7JIR", licensee: "Danielsen, Jacob M", phone: "206-463-", address: "16400 Vashon Hwy, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7JIS", licensee: "Hauser, James W", phone: "206-463-", address: "21713 Highland Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7JIT", licensee: "Goebel, David A", phone: "206-463-", address: "12412 Vashon Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7JIU", licensee: "Cain, Lidunn O", phone: "206-463-", address: "9130 Sw Cemetery Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7JIV", licensee: "York, Randy K", phone: "206-463-", address: "27909 140Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7JIX", licensee: "De Monterey Richoux, Victoria", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7JIY", licensee: "Freiling, Beth Anne", phone: "206-463-", address: "12412 Vashon Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7JJA", licensee: "Jones, Aaron", phone: "206-463-", address: "10411 Sw Cemetery Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7LMS", licensee: "Bush, Gregory M", phone: "206-463-", address: "14830 Glen Acres Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7NCF", licensee: "Gagner, Craig A", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7PNB", licensee: "Meyer, Michael T", phone: "206-463-", address: "25814 78Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7RTH", licensee: "Hennessey, Shannon M", phone: "206-463-", address: "14605 107Th Way Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KB7MTM", licensee: "Meyer, Michael T", phone: "206-463-", address: "25814 78Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7TAN", licensee: "James, Lawrence C", phone: "206-463-", address: "23632 71St Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7UAY", licensee: "Allen, Thomas M", phone: "206-463-", address: "25812 76Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7UAZ", licensee: "Bossom, Eden A", phone: "206-463-", address: "20318 81St Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7UBA", licensee: "Sussman, Carole E", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7UBB", licensee: "Wilber, Maurice E", phone: "206-463-", address: "12057 Sw 208Th Street, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7UBC", licensee: "Los, Shango", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7UBD", licensee: "Clark, Brad S", phone: "206-463-", address: "19103 Vashon Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7UBF", licensee: "Fairchild, Josephine B", phone: "206-463-", address: "6919 Sw 248Th St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7UBG", licensee: "Larson, Rachel A", phone: "206-463-", address: "29428 129Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7UBH", licensee: "Maurer, Michele L", phone: "206-463-", address: "12889 Burma Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7UBI", licensee: "Kutscher, Susan H", phone: "206-463-", address: "16212 Vashon Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7UBJ", licensee: "Davidson, Edward D", phone: "206-463-", address: "23310 Landers Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7UBK", licensee: "Milovsoroff, Peter", phone: "206-463-", address: "8225 Sw Van Olinda Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7RAL", licensee: "Larson, Rachel A", phone: "206-463-", address: "29428 129Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7AAY", licensee: "Rentfro, Samuel J", phone: "206-463-", address: "10924 Sw Cove Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7EOA", licensee: "Proffit, Spencer L", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7EOB", licensee: "Hubbard, Suzanne F", phone: "206-463-", address: "9131 Sw Gorsuch, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7EOC", licensee: "Brown, Paul S", phone: "206-463-", address: "9131 Sw Gorsuch Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7EOD", licensee: "Guerena, Ed R", phone: "206-463-", address: "9731 Sw Elisha Lane, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7EOE", licensee: "Cressman, Miriam S", phone: "206-463-", address: "20704 Old Mill Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7EOF", licensee: "Douvier, Ann B", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7EOG", licensee: "Williams Jr, Morris C", phone: "206-463-", address: "25913 99Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7EOH", licensee: "Wallace, Thomas C", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7EOI", licensee: "Lilje, James J", phone: "206-463-", address: "9631 Sw 288Th St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7EOJ", licensee: "Beles, Craig C", phone: "206-463-", address: "18823 Robinwood Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7EOK", licensee: "Graham, L Jill", phone: "206-463-", address: "8805 Sw Dilworth Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7EOL", licensee: "Thayer, Roaxanne B", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7EOM", licensee: "Sager, Virginia", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7EON", licensee: "Shepard, Meredith A", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "AE7RW", licensee: "York, Randy K", phone: "206-463-", address: "27909 140Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7GZO", licensee: "Wilks, Nicholas T", phone: "206-463-", address: "11623 Sw Bank Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "N0WNW", licensee: "Wilks, Nicholas T", phone: "206-463-", address: "11623 Sw Bank Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7HQI", licensee: "Allen, Steven B", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7SBA", licensee: "Allen, Steven B", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7KLO", licensee: "Luckett, Peter G", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7LBB", licensee: "Marshall, Jourdan S", phone: "206-463-", address: "9032 Sw Soper Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7MLU", licensee: "Templeman, Michael L", phone: "206-463-", address: "22715 Carey Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7MMD", licensee: "Wanzel, Eric W", phone: "206-463-", address: "11410 103Rd Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7PHG", licensee: "Gagner, Craig A", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7RYQ", licensee: "Stead, Daniel E", phone: "206-463-", address: "19009 Beall Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7RYY", licensee: "Carlson, Robert E", phone: "206-463-", address: "11309 Sw Cedarhurst Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KV3SPA", licensee: "Marshall, Jourdan S", phone: "206-463-", address: "9032 Sw Soper Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7SLB", licensee: "Solon, Denna E", phone: "206-463-", address: "8216 Sw Quartermaster Dr, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7SWF", licensee: "Rowan, Jonathan P", phone: "206-463-", address: "29410 129Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KB7REC", licensee: "Carlson, Robert E", phone: "206-463-", address: "11309 Sw Cedarhurst Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7TYW", licensee: "Rousseau, Susan", phone: "206-463-", address: "15314 Vermontville Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7TYX", licensee: "Mitcham, Kevin", phone: "206-463-", address: "15314 Vermontville Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7UQK", licensee: "Lindgren, Clifford W", phone: "206-463-", address: "23117 111Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KI7WYU", licensee: "Herridge, Brook E", phone: "206-463-", address: "15324 Vermontville Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KB7PII", licensee: "Lindgren, Clifford W", phone: "206-463-", address: "23117 111Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7CJP", licensee: "Cohen, Jeffrey A", phone: "206-463-", address: "16203 91St Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7DYP", licensee: "Will, Bryce M", phone: "206-463-", address: "23304 115Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7FCE", licensee: "Harmon, Corinne C", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7FCF", licensee: "Satori, Jessika", phone: "206-463-", address: "20211 Vashon Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7FCG", licensee: "West, Charles W", phone: "206-463-", address: "13318 Sw 261St Place, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7FCH", licensee: "Gomez, Erica L", phone: "206-463-", address: "19722 Vashon Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7FCI", licensee: "Strasz, Rachel A", phone: "206-463-", address: "25833 75Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7FCJ", licensee: "Hosticka, Eric", phone: "206-463-", address: "18109 Thorsen Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7FCK", licensee: "Macewan, Allison A", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7FCL", licensee: "Piston, Robert E", phone: "206-463-", address: "23720 97Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7FCM", licensee: "Piston, Jane W", phone: "206-463-", address: "23720 97Th Ave Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7FCO", licensee: "Shepherd, William B", phone: "206-463-", address: "17912 Mclean Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7FCP", licensee: "Cain, Lars O", phone: "206-463-", address: "9130 Sw Cemetary Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7FCQ", licensee: "Hudson Iv, Thomas F", phone: "206-463-", address: "19722 Vashon Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7FCR", licensee: "Pierson Jr, Edward L", phone: "206-463-", address: "9724 Sw 268Th St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7FDJ", licensee: "Hosticka, Nancy J", phone: "206-463-", address: "18109 Thorsen Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KN7ELP", licensee: "Pierson Jr, Edward L", phone: "206-463-", address: "9724 Sw 268Th St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7KIF", licensee: "Etley, Stephanie A", phone: "206-463-", address: "12350 Sw 266Th Ln, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7KSZ", licensee: "Van Holde, David J", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7ISL", licensee: "Van Holde, David J", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KV7AMS", licensee: "Luckett, Fr. Peter G", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7MXH", licensee: "Witmer, Michael D", phone: "206-463-", address: "4927 Sw Pt Robinson Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "WD3B", licensee: "Boardman, James H", phone: "206-463-", address: "10619 Sw Cowan Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "K7NC", licensee: "Boardman, James H", phone: "206-463-", address: "10619 Sw Cowan Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7QFF", licensee: "Clemons, Timothy S", phone: "206-463-", address: "10134 Sw 280Th St, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W2PEE", licensee: "Eivy, Adam D", phone: "206-463-", address: "15130 Glen Acres Rd Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KJ7TTU", licensee: "Harris, Kevin", phone: "206-463-", address: "16633 Westside Hwy Sw, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "N7RLV", licensee: "Horsch, Robert", phone: "206-463-", address: "9216 Southwest Harbor Drive, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KK7BRI", licensee: "Cunningham, Jeremy", phone: "206-463-", address: "9225 Sw Summerhurst Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KK7CEL", licensee: "Chiswell, Thomas J", phone: "206-463-", address: "7613 Sw 258Th Ct, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "AI7KV", licensee: "Cunningham, Jeremy", phone: "206-463-", address: "9225 Sw Summerhurst Rd, Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7GMW", licensee: "Hill, Deborah", phone: "206-463-", address: ", Vashon, WA 98070", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KB7ANI", licensee: "Gordon, Frances M", phone: "206-463-", address: ", Burton, WA 98013", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "N7KZQ", licensee: "Gordon, Richard S", phone: "206-463-", address: ", Burton, WA 98013", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "N7OUW", licensee: "Malone, Sean C", phone: "206-463-", address: "26026 120Th Ln. S. W., Burton, WA 98013", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7CHY", licensee: "Champion, Frank G", phone: "206-463-", address: ", Burton, WA 98013", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KD7ZYI", licensee: "Straube, Dave D", phone: "206-463-", address: ", Burton, WA 98013", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7HCC", licensee: "Burke, John J", phone: "206-463-", address: ", Burton, WA 98013", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "W7CPN", licensee: "Burke, John J", phone: "206-463-", address: ", Burton, WA 98013", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7KDT", licensee: "Milligan, Douglas S", phone: "206-463-", address: ", Burton, WA 98013", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KE7KDU", licensee: "Milligan, Janet L", phone: "206-463-", address: ", Burton, WA 98013", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "N0VYO", licensee: "Greer, David J", phone: "206-463-", address: "876 Curtis St, 2508, Burton, WA 98013", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7BSP", licensee: "Nelson, Kimberley A", phone: "206-463-", address: ", Burton, WA 98013", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"},
      {callsign: "KG7JIW", licensee: "Tuttle, Holly K", phone: "206-463-", address: ", Burton, WA 98013", image: "./assets/imgs/REW/male.png", team: "t999", icon: " ", status: "Licensed", note: "-"}

    )
    /*
      this.rangers2.push(

        { callsign: "KB0LJC", licensee: "Hirsch, Justin D", image: "./assets/imgs/REW/male.png", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "AC7TB", licensee: "Sullivan, Timothy X", image: "./assets/imgs/REW/female.png", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "KE7KDQ", licensee: "Cornelison, John", image: "./assets/imgs/REW/ke7kdq.jpg", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "AE7MW", licensee: "Smueles, Robert E", image: "./assets/imgs/REW/RickWallace.png", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "AE7RW", licensee: "York, Randy K", image: "./assets/imgs/REW/VI-0003.jpg", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "AE7SD", licensee: "Danielson, Sharon J", image: "./assets/imgs/REW/VI-0034.jpg", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "AE7TH", licensee: "Hardy, Timothy R", image: "./assets/imgs/REW/VI-0038.jpg", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "AG7TJ", licensee: "Lindgren, Katrina J", image: "./assets/imgs/REW/VI-0041.jpg", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "AK7C", licensee: "Mcdonald, Michael E", image: "./assets/imgs/REW/VI-0056.jpg", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "K1SAB", licensee: "Brown, Steven A", image: "./assets/imgs/REW/VI-0058.jpg", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "K3QNQ", licensee: "Treese, F Mitch A", image: "./assets/imgs/REW/VI-0069.jpg", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "K6AJV", licensee: "Valencia, Andrew J", image: "./assets/imgs/REW/VI-007.jpg", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "K7AJT", licensee: "Tharp, Adam J", image: "./assets/imgs/REW/VI-0073.jpg", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "K7DGL", licensee: "Luechtefeld, Daniel", image: "./assets/imgs/REW/VI-0073.jpg", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "K7KMS", licensee: "Paull, Steven", image: "./assets/imgs/REW/VI-0089.jpg", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "K7NHV", licensee: "Francisco, Albert K", image: "./assets/imgs/REW/male.png", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "K7VMI", licensee: "De Steiguer, Allen L", image: "./assets/imgs/REW/K7VMI.jpg", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "KA7THJ", licensee: "Hanson, Jay R", image: "./assets/imgs/REW/male.png", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "KB7LEV", licensee: "Lysen, Kurt A", image: "./assets/imgs/REW/female.png", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" },
        { callsign: "KB7MTM", licensee: "Meyer, Michael T", image: "./assets/imgs/REW/VI-0123.jpg", phone: "206-463-0000", address: "St, Vashon, WA", team: "", icon: "", status: "Normal", note: "" }
         )
    */
    //console.log(`Next: update LocalStorage: ${this.localStorageRangerName}`)
    this.SortRangersByCallsign()
    this.UpdateLocalStorage();
    //console.log(`returned from: updating LocalStorage: ${this.localStorageRangerName}`)
  }

  // TODO:  getActiveRangers() {
  // filter for Ranger.status == 'checked in' ?
  // return this.rangers }

  /* Needed?!
  sortRangersByTeam() {
    return this.rangers.sort((n1, n2) => {
      if (n1.team > n2.team) { return 1 }
      if (n1.team < n2.team) { return -1 }
      return 0;
    })
  }
*/
}


/*
export class Ranger {

  static nextId = 1;
  id: Number;
  date: Date;
  callSign: string;
  licensee: string;

  constructor(callSign: string, name: string, licensee: string, team: string, licenseKey: string, phone: string, email: string, icon: string, note: string) {
    this.id = Ranger.nextId++; // TODO: OK if user restarts app during SAME mission #?
    this.date = new Date();
    this.callSign = callSign;
    this.licensee = licensee;

    // add validation code here?! or in forms code?
  }

}*/

