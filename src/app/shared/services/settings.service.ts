import { Injectable } from '@angular/core';
import * as secrets from '../../../assets/data/secrets.json' // national secrets... & API-Keys. gitignore's

export type SecretType = {
  "id": number,
  "name": string,
  "url": string,
  "key": string,
  "note": string
}

export type SettingsType = {
  id: number,
  name: string,
  application: string,
  version: string,
  note: string,
  defLat: number,
  defLng: number,
  defZoom: number,
  defPlusCode: string,
  w3wLocale: string,
  markerSize: number,
  markerShape: number,
  defRangerStatus: number
  allowManualPinDrops: boolean,
  debugMode: boolean,
  logToPanel: boolean,
  logToConsole: boolean
}

export type FieldReportStatusType = { status: string, color: string, icon: string }

const _version = '0.11.36'  // ALSO NEED TO UPDATE package.json!!!

@Injectable({ providedIn: 'root' })
export class SettingsService {
  static storageLocalName = 'appSettings'
  static secrets: SecretType[]
  static Settings: SettingsType
  static debugMode: any;
  static localStorageFieldReportStatusName = 'fieldReportStatuses'
   fieldReportStatuses: FieldReportStatusType[] = []

  constructor() {
    console.log("Contructing SettingsService: once or repeatedly?!--------------") // XXX


    // REVIEW: Workaround for "Error: Should not import the named export (imported as 'secrets') from default-exporting module (only default export is available soon)"
    let secretWorkaround = JSON.stringify(secrets)
    SettingsService.secrets = JSON.parse(secretWorkaround)
    //console.log('Got secrets from JSON file. e.g., ' + JSON.stringify(SettingsService.secrets[3]))
    // TODO: https://developer.what3words.com/tutorial/hiding-your-api-key


    // populate SettingsService.Settings
    // BUG: Doesn't auto-update version & other settings not exposed!!!
    let localStorageSettings = localStorage.getItem(SettingsService.storageLocalName)
    let needSettings =  SettingsService.Settings==undefined
    if (needSettings) {
      console.log("Get Settings...")
      try {
        if (localStorageSettings != null && localStorageSettings.indexOf("defPlusCode") > 0) {
          SettingsService.Settings = JSON.parse(localStorageSettings)
          console.log("Initialized App Settings from localstorage")
          needSettings = false
        }
      } catch (error: any) {
        console.log(`localstorage App Settings i.e., ${localStorageSettings} should be deleted & reset: unable to parse them. Error name: ${error.name}; msg: ${error.message}`);
      }
    }
    if (needSettings) { SettingsService.ResetDefaults() }
    //REVIEW:
    SettingsService.Settings.version = _version

    let localStorageFieldReportStatuses = localStorage.getItem(SettingsService.localStorageFieldReportStatusName)
    let needStatuses =  this.fieldReportStatuses==undefined
    if (needStatuses) {
      console.log("Get Settings...")
      try {
        if (localStorageFieldReportStatuses != null && localStorageFieldReportStatuses.indexOf("status") > 0) {
          this.fieldReportStatuses = JSON.parse(localStorageFieldReportStatuses)
          console.log("Initialized fieldreport statuses from localstorage")
          needStatuses = false
        }
      } catch (error: any) {
        console.log(`localstorage App Settings i.e., ${localStorageSettings} should be deleted & reset: unable to parse them. Error name: ${error.name}; msg: ${error.message}`);
      }
    }
    if (needSettings) { this.ResetFieldReportStatusDefaults() }

  }

  static ResetDefaults() {
    //original hardcoded defaults... not saved until form is submitted... This form doesn't allow editing of all values
    console.log("Initialize App Settings from hardcoded values")

    // TODO: Need different sets for each type of map, and perhaps various (selectable/savable) copies of 'preferences'
    SettingsService.Settings = {
      id: 0,  // FUTURE: allow different setts of settings (e.g., per location)???
      name: "standard hardcoded settings",
      application: "RangerTrak",
      version: _version, //TODO: Auto update this...
      note: "values set by code, please edit them to serve you!",
      defLat: 47.4472,
      defLng: -122.4627,  // Vashon EOC!
      defZoom: 14,
      defPlusCode: '84VVCGWP+VW', // or "CGWP+VX Vashon, Washington" = 47.447187,-122.462688
      w3wLocale: "Vashon, WA",
      markerSize: 5,
      markerShape: 1,
      defRangerStatus: 0, // TODO: Allow editing this
      allowManualPinDrops: false,
      debugMode: true,
      logToPanel: true,
      logToConsole: true
    }
  }

  // TODO: Use a Map instead: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#objects_vs._maps
  ResetFieldReportStatusDefaults() {
    this.fieldReportStatuses = [           // TODO: Allow editing this
      { status: 'Normal', color: '', icon: '' },  // Often the default value: see SettingsService.defRangerStatus
      { status: 'Need Rest', color: 'cce', icon: '' },
      { status: 'Urgent', color: 'red', icon: '' },
      { status: 'Objective Update', color: 'aqua', icon: '' },
      { status: 'Check-in', color: 'grey', icon: '' },
      { status: 'Check-out', color: 'dark-grey', icon: '' }
    ]
  }

  static Update(newSettings: SettingsType) {
    // TODO: any validation...
    localStorage.setItem(SettingsService.storageLocalName, JSON.stringify(newSettings));
    console.log("Updated Application Settings to " + JSON.stringify(newSettings))
  }

  public getFieldReportStatuses() {
    return this.fieldReportStatuses
  }

  updateFieldReportStatus(newStatuses: FieldReportStatusType[]) {
    // TODO: any validation...
    localStorage.setItem(SettingsService.localStorageFieldReportStatusName, JSON.stringify(newStatuses));
    console.log("Updated FieldReport Statuses to " + JSON.stringify(newStatuses))
  }

  localStorageVoyeur() {
    let key
    for (var i = 0; i < localStorage.length; i++) {
      key = localStorage.key(i)
      if (key != null) {
        console.log(`item ${i} = ${JSON.parse(key)}`)
      }
    }
  }
}
