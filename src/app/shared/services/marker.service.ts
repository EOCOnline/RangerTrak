import * as L from 'leaflet';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PopupService } from './popup.service';

export type MarkerType = {
  lat: number,
  lng: number,
  label: string,
  draggable: boolean
}

@Injectable({providedIn: 'root'})
export class MarkerService {
  stations: string = '/assets/data/VashonFireStations.geojson';

  constructor(private http: HttpClient, private popupService: PopupService) {
  }

  static scaledRadius(val: number, maxVal: number): number {
    return 20 * (val / maxVal);
  }

  makeStationMarkers(map: L.Map): void {
    this.http.get(this.stations).subscribe((res: any) => {
      for (const c of res.features) {
        const lat = c.geometry.coordinates[0];
        const lon = c.geometry.coordinates[1];
        const marker = L.marker([lat, lon]);

        marker.addTo(map);
      }
    });
  }

  makeCapitalCircleMarkers(map: L.Map): void {


    this.http.get(this.stations).subscribe((res: any) => {

      const maxPop = Math.max(...res.features.map((x: { properties: { population: number; }; }) => x.properties.population), 0);

      for (const c of res.features) {
        const lat = c.geometry.coordinates[0];
        const lon = c.geometry.coordinates[1];
        const circle = L.circleMarker([lat, lon], {
          radius: MarkerService.scaledRadius(c.properties.population, maxPop)
        });

        circle.bindPopup(this.popupService.makeStationPopup(c.properties));

        circle.addTo(map);
      }
    });
  }

  labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  generateFakeMarkerData(markers:MarkerType[], num: number = 15) {
    console.log("Generating " + num + " more rows of FAKE field reports!")
    for (let i = 0; i < num; i++) {
      markers.push(
        {
          lat: 45 + Math.floor(Math.random() * 2000) / 1000,
          lng: -121 + Math.floor(Math.random() * 1000) / 1000,
          label: this.labels[Math.floor(Math.random() * this.labels.length)],
          draggable: true
        }
      )
    }
    //console.log("Pushed # " + numberPushed++)
  }


/*   FROM OLD gmap component code...
   // Create an array of alphabetical characters used to label the markers.
   this.generateFakeData()

   // Add some markers to the map.
   const markers = this.markerLocations.map((position, i) => {
     const label = this.labels[i % this.labels.length];
     const marker = new google.maps.Marker({
       position,
       label,
     });

     // markers can only be keyboard focusable when they have click listeners
     // open info window when marker is clicked
     marker.addListener("click", () => {
       infoWindow.setContent(label);
       infoWindow.open(map, marker);
     });

     return marker;
   });
*/



}
