/*

    This file is part of Backtrack.

    Backtrack is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Backtrack is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Backtrack.  If not, see <http://www.gnu.org/licenses/>.
    
*/

var app = {

  geoWatch: null,
  netWatch: null,
  
  netLast: null,
  geoLast: null,
  netLastTime: null,
  geoLastTime: null,
  
  keyRoot            = 'bktrk.root',
  keySessionID       = 'bktrk.session',
  keyRecordCounter   = 'bktrk.records',
  keyPrefixRecord    = 'bktrk.r', // e.g: bktrk.r00000000
  keyLastCovGeo      = 'bktrk.lastCovGeo',
  keyLastCovNet      = 'bktrk.lastCovNet',
  
  options: {
    geo: {
      maximumAge: 5000, 
      timeout: 60000, 
      enableHighAccuracy: true 
    },
    net: {
      interval: 5000
    }
  },
  
  start: function() {
    document.addEventListener('deviceready', app.deviceReady, false);
    app.initStorage();
  },
  
  initStorage: function() {
    var ls = window.localStorage;
    if (ls.getItem(app.rootKey) === null) {
      ls.clear();
      ls.setItem(app.rootKey, true);
      ls.setItem(app.recordCounterKey, 0);
    }
  },
  
  deviceReady: function() {
    document.addEventListener(app.eventRecord, app.storeRecord, false);
    app.geoWatch = navigator.geolocation.watchPosition(app.geoSuccess, app.geoError, app.options.geo);
    app.netWatch = window.setInterval(app.netTimer, app.options.net.interval);
  },
  
  hasCoverage: function(connType) {
    return connType !== Connection.NONE && connType !== Connection.UNKNOWN;
  },
  
  geoSuccess: function(position) {
    app.storeRecord(position, navigator.connection.type);
    app.updateDisplay();
  },
  
  geoError: function(error) {
    return; // do nothing...
  },
  
  netTimer: function() {
    app.storeRecord(null, navigator.connection.type);
    app.updateDisplay();
  },
  
  getRecordKey: function(ID) {
    var _ID = ID.toString(16);
    return app.keyPrefixRecord + new Array(9 - _ID.length).join('0') + _ID;
  },
  
  storeRecord: function(geo, net) {
    var ls = window.localStorage;
    var ID = app.getRecordKey(ls.getItem(app.recordKeyCounter)|0);
    
    if (net == app.netLast && geo == app.geoLast)
      return;
    
    var record = {
      time: Date.now,
      net: net,
      geo: geo
    };
    
    if (net !== null) {
      app.netLast = net;
      app.netLastTime = record.time;
      app.netLastRecord = ID;
    }
    if (geo !== null) {
      app.geoLast = geo;
      app.geoLastTime = record.time;
      app.geoLastRecord = ID;
    }
    
    if (net !== null && app.hasCoverage(net)) {
      ls.setItem(app.keyLastCovGeo, app.geoLastRecord);
      ls.setItem(app.keyLastCovNet, app.netLastRecord);
    }
    ls.setItem(ID, record);
    ls.setItem(app.recordKeyCounter, records+1);
  },
  
  /////////////////////////////////////////////////////////////////////////////
  //                                                                         //
  //                   D I S P L A Y   F U N C T I O N S                     //
  //                                                                         //
  /////////////////////////////////////////////////////////////////////////////
  
  dispWatch: null,
  
  display: {
    curGeo: null,
    curNet: null,
    curTime: null,
    lastCovGeo: null,
    lastCovNet: null
  },
  
  initDisplay: function() {
    app.display.curGeo = document.getElementById('curGeo');
    app.display.curNet = document.getElementById('curNet');
    app.display.curTime = document.getElementById('curTime');
    app.display.lastCovGeo = document.getElementById('lastCovGeo');
    app.display.lastCovNet = document.getElementById('lastCovNet');
    app.dispWatch = window.setInterval(app.updateDisplay, 1000);
  },
  
  updateDisplay: function() {
    var ls = window.localStorage;
    
    app.display.curGeo.innerHtml = app.formatGeo(app.geoLast);
    app.display.curNet.innerHtml = app.hasCoverage(app.netLast);
    app.display.curTime.innerHtml = new Date().toLocaleString();
    
    app.display.lastCovGeo.innerHtml = '';
    var recordLastCovGeo = ls.getItem(keyLastCovGeo);
    if (recordLastCovGeo !== null) {
      var lastCovGeo = ls.getItem(recordLastCovGeo);
      if (lastCovGeo !== null) {
        app.display.lastCovGeo.innerHtml = app.formatGeo(lastCovGeo.geo);
      }
    }
    
    app.display.lastCovNet.innerHtml = '';
    var recordLastCovNet = ls.getItem(keyLastCovNet);
    if (recordLastCovNet !== null) {
      var lastCovNet = ls.getItem(recordLastCovNet);
      if (lastCovNet !== null) {
        app.display.lastCovNet.innerHtml = lastCovNet.time;
      }
    }    
  },
  
  formatGeo: function(geo) {
    return geo.coords.latitude + ", " + geo.coords.longitude + " (" + geo.coords.accuracy + "); " + 
           geo.coords.altitude + " (" + geo.coords.altitudeAccuracy + "); " + geo.timestamp;
  }
  
};
