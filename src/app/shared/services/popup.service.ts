
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

@Injectable({providedIn: 'root'})
export class PopupService {

    constructor() { }

    makeStationPopup(data: any): string {
      return `` +
        `<div>Station: ${ data.name }</div>` +
        `<div>Address: ${ data.address }</div>` +
        `<div>Population: ${ data.population }</div>`
    }
  }

