//import * as I from "./"
import { what3words } from "@what3words/javascript-components"
// <script src="https://assets.what3words.com/sdk/v3/what3words.js?key=YOUR_API_KEY"></script>
// mainly from https://developer.what3words.com/tutorial/javascript
import { UrlHandlingStrategy } from "@angular/router";


// from https://developer.what3words.com/tutorial/javascript
/**
 * Converts a coordinate to a 3 word address
 * @param {Object} coordinates - The coordinate object
 * @param {number} coordinates.lat - The latitude
 * @param {number} coordinates.lng - The longitude
 * @param {string} [language=en] - The language to return the 3 word address in
 * @returns {Promise} Promise 3 word address response
 */
 what3words.api.convertTo3wa({lat:51.508344, lng:-0.12549900}, 'en')
 .then(function(response: any) {
   console.log("[convertTo3wa]", response);
 });

/**
 * Returns coordinates for a 3 word address
 * @param {string} words - The 3 word address words to convert to coordinates
 * @returns {Promise} - Promise coordinates response
 */
 what3words.api.convertToCoordinates("filled.count.soap")
 .then(function(response: any) {
    console.log("[convertToCoordinates]", response);
 });

 /* AutoSuggest
When presented with a 3 words address which may be incorrectly entered, AutoSuggest returns a list of potential correct 3 word addresses. It needs the first two words plus at least the first character of the third word to produce suggestions.

This method provides corrections for mis-typed words (including plural VS singular), and words being in the wrong order.

Optionally, clipping can narrow down the possibilities, and limit results to:

One or more countries
A geographic area (a circle, box or polygon)
This dramatically improves results, so we recommend that you use clipping if possible.

To improve results even further, set the focus to user’s current location. This will make autosuggest return results which are closer to the user.

More information about autosuggest, including returned results is available in the what3words REST API documentation.

Example: Basic Autosuggest call
*/
/**
 * Returns autosuggest results for a search term
 * @param {string} input - The input to search for autosuggests
 * @param {Object} [options] - The result filter and clipping options
 * @param {Object} [options.focus] - The coordinates for the focus of the search
 * @param {number} [options.focus.lat] - The latitude of the focus
 * @param {number} [options.focus.lng] - The longitude of the focus
 * @param {string} [options.nFocusResults] - The number of focused results
 * @param {string[]} [options.clipToCountry] - The countries to clip results to
 * @param {Object} [options.clipToBoundingBox] - The bounding box to clip results within
 * @param {Object} [options.clipToBoundingBox.southwest] - The coordinates of the southwest corner of the clipping box
 * @param {Object} [options.clipToBoundingBox.southwest.lat] - The latitude of the southwest corner of the clipping box
 * @param {Object} [options.clipToBoundingBox.southwest.lng] - The longitude of the southwest corner of the clipping box
 * @param {Object} [options.clipToBoundingBox.northeast] - The coordinates of the northeast corner of the clipping box
 * @param {Object} [options.clipToBoundingBox.northeast.lat] - The latitude of the northeast corner of the clipping box
 * @param {Object} [options.clipToBoundingBox.northeast.lng] - The longitude of the northeast corner of the clipping box
 * @param {Object} [options.clipToCircle] - The circle to clip results within
 * @param {Object} [options.clipToCircle.center] - The center of the circle to clip results within
 * @param {number} [options.clipToCircle.center.lat] - The latitude of the center of the circle to clip results within
 * @param {number} [options.clipToCircle.center.lng] - The longitude of the center of the circle to clip results within
 * @param {number} [options.clipToCircle.radius] - The radius of the circle to clip results within
 * @param {number[]} [options.clipToPolygon] - An array of polygon coordinates to clip results within
 * @param {string} [options.inputType] - 'text' | 'vocon-hybrid' | 'nmdp-asr' | 'generic-voice'
 * @param {string} [options.language] - The language to return autosuggest results in
 * @param {boolean} [options.preferLang] - Whether to bias towards results that are over land vs over the sea.
 * @returns {Promise} - Promise 3 word address autosuggestions response: any
 */
 what3words.api.autosuggest("fun.with.code")
 .then(function(response: any) {
    console.log("[autosuggest]", response: any);
 });

 // AutoSuggest, clipping the results returned to France and Germany


 what3words.api.autosuggest("fun.with.code", { clipToCountry: ["FR", "DE"] })
 .then(function(response: any) {
   console.log("[autosuggest]", response: any);
 }
);

// clip to circle
what3words.api.autosuggest("fun.with.code", { clipToCircle: {center: {lat:51.4243877, lng:-0.34745}, radius:50} })
  .then(function(response: any) {
    console.log("[autosuggest]", response: any);
  }
);

// clip to polygon
what3words.api.autosuggest("fun.with.code", { clipToPolygon: [51.421,-0.343,52.6,2.3324,54.234,8.343,51.421,-0.343] })
  .then(function(response: any) {
    console.log("[autosuggest]", response: any);
  }
)

what3words.api.autosuggest("fun.with.code", { clipToBoundingBox:{ southwest: { lat: 51.521, lng: -0.343 },
    northeast: { lat: 52.6, lng: 2.3324 } }})
  .then(function(response: any) {
    console.log("[autosuggest]", response: any);
  }
);

what3words.api.autosuggest("fun.with.code", { focus: {lat:51.4243877, lng:-0.34745} })
  .then(function(response: any) {
    console.log("[autosuggest]", response: any);
  }
);


// errors
// Errors returned from the API can be caught with the wrapper through the use of a catch function.


// Within the catch function, code and message values which represent the error, are accessible from the error object parameter

what3words.api.convertToCoordinates("filled.count.soap")
  .then(function(response: any) {
    console.log("[convertToCoordinates]", response: any);
  })
  .catch(function(error) { // catch errors here
    console.log("[code]", error.code);
    console.log("[message]", error.message);
  });


// -----------------------------------------------------------------------------------------


export class chk3Words {

  private static API_KEY = "YBIMPRHH" // For RangerTrak  // TODO: Hide as a private key

  constructor() {
  }

  static settings = {
    "async": true,
    "crossDomain": true,
    "url": "https://api.what3words.com/v3/autosuggest?key=" + chk3Words.API_KEY + "&input=index.home.r&n-results=5&focus=51.521251%2C-0.203586&clip-to-country=BE%2CGB",
    "method": "GET",
    "headers": {}
  }


  ShapedAs3Words(threeWords: string): boolean {
    // from https://developer.what3words.com/tutorial/detecting-if-text-is-in-the-format-of-a-3-word-address
    var regex = /^\/{0,}[^0-9`~!@#$%^&*()+\-_=[{\]}\\|'<,.>?/";:£§º©®\s]{1,}[.｡。･・︒។։။۔።।][^0-9`~!@#$%^&*()+\-_=[{\]}\\|'<,.>?/";:£§º©®\s]{1,}[.｡。･・︒។։။۔።।][^0-9`~!@#$%^&*()+\-_=[{\]}\\|'<,.>?/";:£§º©®\s]{1,}$/;

    if (regex.test(threeWords))
      // is the format of a three word address
      return true
    else
      // is NOT a three word address
      return false
  }

  Get3WordsFromLatLong(lat: number, long: number): string {
    /**
     * Converts a coordinate to a 3 word address
     * @param {Object} coordinates - The coordinate object
     * @param {number} coordinates.lat - The latitude
     * @param {number} coordinates.lng - The longitude
     * @param {string} [language=en] - The language to return the 3 word address in
     * @returns {Promise} Promise 3 word address response: any
     */
    what3words.api.convertTo3wa({ lat: 51.508344, lng: -0.12549900 }, 'en')
      .then(function (response: any) {
        console.log("[convertTo3wa]", response: any);
        return response: any
      });
  }

  // Javascript autosuggest tutorial:
  // https://developer.what3words.com/tutorial/javascript-autosuggest-component-v4


  GetLatLongFrom3Words(threeWords: string) {

    /**
     * Returns coordinates for a 3 word address
     * @param {string} words - The 3 word address words to convert to coordinates
     * @returns {Promise} - Promise coordinates response: any
     */
    what3words.api.convertToCoordinates("filled.count.soap")
      .then(function (response: any) {
        console.log("[convertToCoordinates]", response: any);
      });




    if (threeWords.length) {
      // something entered...

      //MAIN.dbug("3Words='" + threeWords + "'")
      what3words.api.autosuggest(threeWords, {
        nFocusResults: 1,
        //clipTo####: ["US"],
        cliptoboundingbox: { south_lat, west_lng, north_lat, east_lng }, // Clip prevents ANY values outside region
        focus: { lat: DEF_LAT, lng: DEF_LONG }, // Focus prioritizes words closer to this point
        nResults: 1
      })
        .then(function (response: any) {
          verifiedWords = response: any.suggestions[0].words
          MAIN.dbug("Verified Words='" + verifiedWords + "'")
          if (threeWords != verifiedWords) {
            document.getElementById("addressLabel")!.textContent = " Verified as: " + verifiedWords
          } else {
            document.getElementById("addressLabel")!.textContent = " Verified."
          }
          what3words.api.convertToCoordinates(verifiedWords).then(function (response: any) {
            //async call HAS returned!
            updateCoords(response: any.coordinates.lat, response: any.coordinates.lng)
            // NOTE: Not saving nearest place: too vague to be of value
            document.getElementById("addressLabel")!.textContent += " Near: " + response: any.nearestPlace
          })
        })
        .catch(function (error) {
          errMsg = "[code]=" + error.code + " [message]=" + error.message + "."
          MAIN.dbug("Unable to verify 3 words entered: " + errMsg)
          document.getElementById("addressLabel")!.textContent = "*** Not able to verify 3 words! ***"
        })
    }
    // async call not returned yet

  }



{

  /**
   * Returns autosuggest results for a search term
   * @param {string} input - The input to search for autosuggests
   * @param {Object} [options] - The result filter and clipping options
   * @param {Object} [options.focus] - The coordinates for the focus of the search
   * @param {number} [options.focus.lat] - The latitude of the focus
   * @param {number} [options.focus.lng] - The longitude of the focus
   * @param {string} [options.nFocusResults] - The number of focused results
   * @param {string[]} [options.clipToCountry] - The countries to clip results to
   * @param {Object} [options.clipToBoundingBox] - The bounding box to clip results within
   * @param {Object} [options.clipToBoundingBox.southwest] - The coordinates of the southwest corner of the clipping box
   * @param {Object} [options.clipToBoundingBox.southwest.lat] - The latitude of the southwest corner of the clipping box
   * @param {Object} [options.clipToBoundingBox.southwest.lng] - The longitude of the southwest corner of the clipping box
   * @param {Object} [options.clipToBoundingBox.northeast] - The coordinates of the northeast corner of the clipping box
   * @param {Object} [options.clipToBoundingBox.northeast.lat] - The latitude of the northeast corner of the clipping box
   * @param {Object} [options.clipToBoundingBox.northeast.lng] - The longitude of the northeast corner of the clipping box
   * @param {Object} [options.clipToCircle] - The circle to clip results within
   * @param {Object} [options.clipToCircle.center] - The center of the circle to clip results within
   * @param {number} [options.clipToCircle.center.lat] - The latitude of the center of the circle to clip results within
   * @param {number} [options.clipToCircle.center.lng] - The longitude of the center of the circle to clip results within
   * @param {number} [options.clipToCircle.radius] - The radius of the circle to clip results within
   * @param {number[]} [options.clipToPolygon] - An array of polygon coordinates to clip results within
   * @param {string} [options.inputType] - 'text' | 'vocon-hybrid' | 'nmdp-asr' | 'generic-voice'
   * @param {string} [options.language] - The language to return autosuggest results in
   * @param {boolean} [options.preferLang] - Whether to bias towards results that are over land vs over the sea.
   * @returns {Promise} - Promise 3 word address autosuggestions response
   */

  what3words.api.autosuggest("fun.with.code", { clipToCircle: { center: { lat: 51.4243877, lng: -0.34745 }, radius: 50 } })
    .then(function (response: any) {
      console.log("[autosuggest]", response);
    }
    );

  //what3words.api.autosuggest("fun.with.code", { clipToPolygon: [51.421,-0.343,52.6,2.3324,54.234,8.343,51.421,-0.343] })
  // what3words.api.autosuggest("fun.with.code", { focus: {lat:51.4243877, lng:-0.34745} })
  // what3words.api.autosuggest("fun with code", {inputType: "generic-voice", language: "en"})


}

{
  /**
 * Returns a section of the what3words grid
 * @param {Object} boundingBox - The bounding box for the grid to return
 * @param {Object} [boundingBox.southwest] - The coordinates of the southwest corner of the bounding box
 * @param {Object} [boundingBox.southwest.lat] - The latitude of the southwest corner of the bounding box
 * @param {Object} [boundingBox.southwest.lng] - The longitude of the southwest corner of the bounding box
 * @param {Object} [boundingBox.northeast] - The coordinates of the northeast corner of the bounding box
 * @param {Object} [boundingBox.northeast.lat] - The latitude of the northeast corner of the bounding box
 * @param {Object} [boundingBox.northeast.lng] - The longitude of the northeast corner of the bounding box
 * @return {Promise} - Promise the grid section
 */
  what3words.api.gridSection({
    southwest: { lat: 51.508341, lng: -0.125499 },
    northeast: { lat: 51.507341, lng: -0.124499 }
  })
    .then(function (response: any) {
      console.log("[gridSection]", response);
    }
    );
}


// Error UrlHandlingStrategy
what3words.api.convertToCoordinates("filled.count.soap")
  .then(function (response: any) {
    console.log("[convertToCoordinates]", response);
  })
  .catch(function (error: { code: any; message: any; }) { // catch errors here
    console.log("[code]", error.code);
    console.log("[message]", error.message);
  });



/*
$.ajax(settings).done(function (response) {
  MAIN.dbug("ddd=" + response)
})
  */

// No 3 word results outside these values allowed!!
// south_lat <= north_lat & west_lng <= east_lng
let south_lat = 46.0
let north_lat = 49.0
let west_lng = -124.0
let east_lng = -120.0
let errMsg = ""

let threeWords = document.getElementById("address")!.innerHTML // was 'addresses'...
//MAIN.dbug(threeWords)

}
