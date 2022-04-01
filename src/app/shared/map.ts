import * as C from "./coordinate"
import { AfterViewInit, Component, ElementRef, Inject, NgZone, OnInit, ViewChild, OnDestroy, isDevMode } from '@angular/core'
import { DOCUMENT, JsonPipe } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { fromEvent, Observable, Subscription } from 'rxjs'
import { catchError, mergeMap, toArray } from 'rxjs/operators';

import { SettingsService, FieldReportService, FieldReportType, FieldReportStatusType, FieldReportsType, LogService, SettingsType, LocationType } from '../shared/services'
import { MDCSwitch } from "@material/switch"
import L from "leaflet"
//import { abstractMap } from '../shared/map'

export enum MapType {
  Google,
  ESRI_Leaflet
}

export interface LayerType {
  id: number
  url: string,
  id2: string,
  attribution: string
}

/*
  Interface are general, lightweight vs. abstract classes as special-purpose/feature-rich (pg 96, Programming Typescript)
  export interface IMap {
    type: MapType,
    layers: LayerType,
    initMap():void,
    displayBeautifulmap(num:number) :void
    }
*/


/**
 *
 * per https://ozak.medium.com/stop-repeating-yourself-in-angular-how-to-create-abstract-components-9726d43c99ab,
 * do NOT use "abstract"!
 *
 * Needs template: https://stackoverflow.com/questions/62222979/angular-9-decorators-on-abstract-base-class
 *
 * https://www.tutorialsteacher.com/typescript/abstract-class
 *
 * https://www.cloudhadoop.com/angular-model-class-interface/
 * https://angular.io/guide/migration-undecorated-classes
 *
 */

/**
 * Inputs:
 * - Leaflet or Google tech
 * - Overview Map : boolean
 * - display fieldReports : boolean
 * - Stuff from Settings: Def_Lat/Lng/Zoom/etc.
 *
 */

export type Map = L.Map | google.maps.Map

@Component({ template: '' })
export class AbstractMap implements OnInit, AfterViewInit, OnDestroy {

  protected id = 'Abstract Map Component'
  public title = 'Abstract Map'

  protected settingsSubscription!: Subscription
  protected settings!: SettingsType

  protected displayReports = true
  protected fieldReportsSubscription!: Subscription
  protected fieldReports: FieldReportsType | undefined
  protected displayedFieldReportArray: FieldReportType[] = []

  protected map!: Map
  protected location!: LocationType
  protected center = { lat: 0, lng: 0 }
  protected mouseLatLng = this.center //google.maps.LatLngLiteral |
  protected zoom = 10 // actual zoom level of main map
  protected zoomDisplay = 10 // what's displayed below main map


  // Only some maps have an overview map, or handle "selected" reports.
  // If not, the following just remain false/undefined, as flags they're not active
  protected hasOverviewMap = false // Guard for overview map logic
  protected overviewMap: L.Map | google.maps.Map | undefined = undefined

  protected hasSelectedReports = false // Guard for the following
  protected selectedReports: FieldReportsType | undefined = undefined
  protected filterSwitch: MDCSwitch | undefined = undefined
  protected filterButton: HTMLButtonElement | undefined = undefined
  protected numSelectedRows = 0
  protected allRows = 0

  constructor(protected settingsService: SettingsService,
    protected fieldReportService: FieldReportService,
    protected httpClient: HttpClient,
    protected log: LogService,
    @Inject(DOCUMENT) protected document: Document) {

    this.log.verbose(`Constructing Abstract Map`, this.id)

    this.settingsSubscription = this.settingsService.getSettingsObserver().subscribe({
      next: (newSettings) => {
        // REVIEW: Any new settings just ripple thru, or does anything need pushing?!
        this.settings = newSettings
      },
      error: (e) => this.log.error('Settings Subscription got:' + e, this.id),
      complete: () => this.log.info('Settings Subscription complete', this.id)
    })

    this.fieldReportsSubscription =
      this.fieldReportService.getFieldReportsObserver().subscribe({
        next: (newReport) => {
          this.gotNewFieldReports(newReport)
        },
        error: (e) => this.log.error('Field Reports Subscription got:' + e, this.id),
        complete: () => this.log.info('Field Reports Subscription complete', this.id)
      })
  }


  /**
   *
   */
  ngOnInit(): void {
    this.log.verbose(`ngOnInit() with development mode ${isDevMode() ? "" : "NOT "}enabled`, this.id)
  }

  /**
   * OK to register for form events here
   */
  ngAfterViewInit() {
    this.log.verbose("ngAfterViewInit()", this.id)

    if (!this.settings) {
      this.log.error(`this.settings not yet established in ngAfterViewInit()`, this.id)
      // REVIEW: Can initMap run OK w/ defaults, but w/o settings
    } else {
      this.center = { lat: this.settings.defLat, lng: this.settings.defLng }
      this.zoomDisplay = this.zoom
    }

    if (this.hasSelectedReports) {
      this.filterButton = document.querySelector('#selectedFieldReports') as HTMLButtonElement
      if (this.filterButton == undefined) {
        this.log.error("initMap() could not find selectedFieldReports", this.id)
      } else {
        // No need to *subscribe* currently, as everytime there is a selection
        // made it gets stored and won't change once we're on this screen
        this.numSelectedRows = this.fieldReportService.getSelectedFieldReports().fieldReportArray.length
        this.filterSwitch = new MDCSwitch(this.filterButton)
        if (!this.filterSwitch) throw ("Found filterButton - but NOT Field Report Selection Switch!")
      }



      //! or

      // Selected Field Reports are retrieved when user clicks the slider switch...but we do need the #!
      //! 2TEST: Does this get re-hit if user swittches back, adjusts # selected rows and returns???
      // BUG: refresh page resets selected switch
      this.onSwitchSelectedFieldReports()

      // Just get the # of rows in the selection (if any), so we can properly display that # next to the switch
      if (this.selectedReports = this.fieldReportService.getSelectedFieldReports()) {
        this.numSelectedRows = this.selectedReports.numReport
        if (this.numSelectedRows != this.selectedReports.fieldReportArray.length) {
          this.log.error(`ngOnInit issue w/ selected rows ${this.numSelectedRows} != ${this.selectedReports.fieldReportArray.length}`, this.id)
          this.selectedReports.numReport = this.selectedReports.fieldReportArray.length
          this.numSelectedRows = this.selectedReports.fieldReportArray.length
        }
      } else {
        this.log.warn(`Could not retrieve selected Field Reports in ngOnInit.`, this.id)
        this.numSelectedRows = 0
      }

      this.filterButton = document.querySelector('#selectedFieldReports') as HTMLButtonElement
      if (!this.filterButton) { throw ("Could not find Field Report Selection button!") }

      this.filterSwitch = new MDCSwitch(this.filterButton)
      if (!this.filterSwitch) throw ("Could not find Field Report Selection Switch!")

    }
    // REVIEW: Following code is duplicated in ngAfterViewInit: which does the task?!
    if (!this.settings) {
      this.log.error(`this.settings not yet established in ngInit()`, this.id)
      return
    }





    //async function name(params: type) {    }

    // Derivitive maps should call this.initMap() themselves
  }

  /**
   *
   * @returns
   */
  initMap() {
    this.log.verbose("initMap()", this.id)


    if (!this.settings) {
      this.log.error(`Settings not yet initialized while initializing the Leaflet Map!`, this.id)
      return
    }

    if (!this.fieldReports) { //! or displayedFieldReportArray
      this.log.error(`fieldReports not yet initialized while initializing the Leaflet Map!`, this.id)
      return
    }


    // this.center = { lat: this.settings ? this.settings.defLat : 0, lng: this.settings ? this.settings.defLng : 0 }


    // TODO: Use an Observable, from https://angular.io/guide/rx-library#observable-creation-functions
    const mapElement = document.getElementById('map')!

    // Create an Observable that will publish mouse movements
    const mouseMoves = fromEvent<MouseEvent>(mapElement, 'mousemove')

    // Subscribe to start listening for mouse-move events
    const subscription = mouseMoves.subscribe(evt => {
      // Log coords of mouse movements
      this.log.verbose(`Coords: ${evt.clientX} X ${evt.clientY}`, this.id)
      this.mouseLatLng = { lat: evt.clientX, lng: evt.clientY }
    })


  }

  nada() {
    if (this.map instanceof L.Map) {
      this.map.on('mousemove', (evt: L.LeafletMouseEvent) => {
        this.mouseLatLng = evt.latlng
      })
    } else {


    }
  }

  // updateOverviewMap() {
  //   this.log.verbose(`updateOverviewMap`, this.id)

  //   //let latlng = new google.maps.LatLng(this.settings.defLat, this.settings.deflng)
  //   //let latlngL = {lat: this.settings.defLat, lng: this.settings.deflng}

  //   // TODO: FitBounds to new point, not to DefLat & Deflng  -- do it on addMarker?
  //   // this.map?.setCenter(latlng) // REVIEW: this and/or next line. (Bounds should be private though!)
  //   //this.map?.fitBounds(this.fieldReportService.bounds.extend({ lat: this.settings.defLat, lng: this.settings.defLng })) // zooms to max!
  //   this.map.setZoom(17) // no effect
  // }

  // onMapMouseMove(event: L.LeafletMouseEvent | google.maps.MapMouseEvent) {
  //   if (event.latLng) {
  //     this.mouseLatLng = event.latLng.toJSON()
  //     //this.log.excessive('moving()', this.id);
  //   }
  //   else {
  //     this.log.warn('move(): NO event.latLng!!!!!!!!!!!!!', this.id);
  //   }
  // }



  isLeafletMap(map: Map): map is L.Map {
    return true;
  }

  isGoogleMap(map: Map): map is google.maps.Map {
    return true
  }

  onMapZoomed() {
    if (this.zoom && this.map) {
      this.zoom = this.map.getZoom()!
    }
  }

  clamp(num: number, min: number, max: number) {
    return Math.min(Math.max(num, min), max)
  }

  refreshMap() {

  }

  // ------------------------------------  Field Reports  ---------------------------------------

  /*
  What gets displayed: alternates between all & selected rows, based on the switch
  private override selectedReports: FieldReportsType | null = null
  public override displayedFieldReportArray: FieldReportType[] = []
  !this is just a subcomponent of the above: use the above if possible...  OH NO: this actually flipps back & forth between all & selected field reports, based on the switch...
  following doesn't need a subscription as user selections are auto-saved & available,
  if they switch to this page
  REVIEW: UNLESS the switch was already on "selected rows" and isn't reswitched!!!: so just check/reset in ngOnInit?!
  */

  gotNewFieldReports(newReports: FieldReportsType) {
    this.log.verbose(`New collection of ${newReports.numReport} Field Reports observed.`, this.id)

    this.allRows = newReports.numReport
    this.fieldReports = newReports
    this.fieldReportArray = newReports.fieldReportArray
    console.assert(this.allRows == this.fieldReportArray.length)
    this.refreshMap()
    // this.reloadPage()  // TODO: needed?
  }

  onSwitchSelectedFieldReports() { //event: any) {
    if (!this.filterSwitch || !this.filterSwitch.selected) {
      if (!this.fieldReports) {
        this.log.error(`field Reports not yet set in onSwitchSelectedFieldReports()`, this.id)
        return
      }
      this.displayedFieldReportArray = this.fieldReports.fieldReportArray
      this.log.verbose(`Displaying ALL ${this.displayedFieldReportArray.length} field Reports`, this.id)
      if (this.numSelectedRows != this.displayedFieldReportArray.length) {
        this.log.warn(`Need to update numSelectedRows ${this.numSelectedRows} != actual array length ${this.displayedFieldReportArray.length}`)
      }
    } else {
      this.displayedFieldReportArray = this.fieldReportService.getSelectedFieldReports().fieldReportArray
      // ! REVIEW: we did NOT grab the whole selectedFieldReports structure, JUST the report array: OK?!
      this.numSelectedRows = this.displayedFieldReportArray.length
      this.log.verbose(`Displaying ${this.displayedFieldReportArray.length} SELECTED field Reports`, this.id)
    }
    // TODO: Need to refresh map?!
    this.refreshMap()
    // this.reloadPage()  // TODO: needed?
  }

  // ------------------------------------  Markers  ---------------------------------------


  displayMarkers() {
    this.log.verbose(`displayMarkers()`, this.id)

    if (!this.displayReports) {
      this.log.error(`displayMarkers() BUT displayReports is false!`, this.id)
    }

    if (!this.displayedFieldReportArray) {
      this.log.error(`displayMarkers() BUT No Field Reports received yet!`, this.id)
      return
    }

    // this.addMarker(this.fieldReports[i].lat, this.fieldReports[i].lng, this.fieldReports[i].status)
  }

  // Deletes all markers in the array by removing references to them.
  removeAllMarkers() {
    this.log.verbose(`removeAllMarkers()`, this.id)
    this.hideMarkers()
    this.markers = []
    // this.map.clear();
    // this.markerCluster.clearMarkers()
  }

  addMarker(lat: number, lng: number, title = 'Latest Location') {


  }

  addManualMarkerEvent(event: google.maps.MapMouseEvent) {
    if (this.settings!.allowManualPinDrops) {
      if (event.latLng) {
        this.addMarker(event.latLng)
      } else {
        this.log.error(`addMarker FAILED`, this.id)
      }
    }
  }

  ngOnDestroy() {
    // this.locationSubscription.unsubscribe()
    this.fieldReportsSubscription.unsubscribe()
    this.settingsSubscription.unsubscribe()
  }
}
