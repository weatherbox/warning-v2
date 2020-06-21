import mapboxgl from 'mapbox-gl';
import SelectedLayer from './SelectedLayer';


export default class PossibilityLayer {
  constructor(map, data, onSelected) {
    this.map = map;
    this.data = data;

    this.map.addSource("vt", {
      "type": "vector",
      "minzoom": 0,
      "maxzoom": 10,
      "tiles": ["https://weatherbox.github.io/warning-area-vt/v2/{z}/{x}/{y}.pbf"]
    });

    this.map.addLayer({
      "id": "pref-line",
      "type": "line",
      "source": "vt",
      "source-layer": "pref",
      "paint": {
        "line-color": "rgba(70, 70, 70, 0.4)"
      }
    });
    this.renderAll();
    this.selectedLayer =  new SelectedLayer(map, onSelected);

    this.popup = new mapboxgl.Popup({
      closeButton: false
    });
    this.map.on('mousemove', this.hover);
  }


  // UI API

  selectDatetime(index) {
    const length1 = this.data.tommorow.timeDefine.length;
    if (index === 0) {
      this.renderAll();

    } else if (index <= length1) {
      this.render1(index - 1);
    } else {
      this.render2(index - length1 - 1);
    }
  }

  selectType(type) {
    console.log(type);
  }


  // 

  renderAll() {
    const stops = [];

    for (let code in this.data.all) {
      const rank = this.data.all[code];
      if (rank) stops.push([code, this.getColor(rank)]);
    }
    this.renderLayer(stops);
  }

  render1(index) {
    const areas = this.data.tommorow.areas;
    const stops = [];

    for (let code in areas) {
      const rank = areas[code].possibilityAll[index];
      if (rank) stops.push([code, this.getColor(rank)]);
    }
    this.renderLayer(stops);
  }
  
  render2(index) {
    const areas1 = this.data.tommorow.areas;
    const areas2 = this.data.dayafter.areas;
    const stops = [];

    for (let code in areas1) {
      const prefCode = areas1[code].area.prefCode;
      const rank = areas2[prefCode].possibilityAll[index];
      if (rank) stops.push([code, this.getColor(rank)]);
    }
    this.renderLayer(stops);
  }

  renderLayer(stops) {
    const fill = stops.length ? {
      "property": "code",
      "type": "categorical",
      "stops": stops,
      "default": "rgba(0, 0, 0, 0)"
    } : null;

    if (!this.added) {
      this.map.addLayer({
        "id": "possibility",
        "type": "fill",
        "source": "vt",
        "source-layer": "distlict",
        "paint": {
          "fill-color": fill,
          "fill-outline-color": "rgba(55, 55, 55, 0.4)"
        }
      }, 'pref-line');
      this.added = true;
    } else {
      this.map.setPaintProperty('possibility', 'fill-color', fill);
    }
  }


  getColor(rank) {
    const colors = {
      '高': 'rgba(253, 108, 112, 0.5)',
      '中':  'rgba(253, 188, 172, 0.4)'
    };
    return colors[rank];
  }

  hover = (e) => {
    const features = this.map.queryRenderedFeatures(e.point, { layers: [] });
    this.map.getCanvas().style.cursor = (features.length) ? 'crosshair' : '';

    let html;
    if (features.length) {
      const code = this.getCode(features[0].properties.code);
      const infos = this.weatherInfo.prefs[code];
      if (infos) {
      }
    }
    
    if (html) {
      this.popup.setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(this.map);
    } else {
      this.popup.remove();
    }
  }
  
}
