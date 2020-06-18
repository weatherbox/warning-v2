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
        "line-color": "rgba(55, 55, 55, 0.4)"
      }
    });
    this.renderAll();
    this.selectedLayer =  new SelectedLayer(map, onSelected);

    this.popup = new mapboxgl.Popup({
      closeButton: false
    });
    this.map.on('mousemove', this.hover);
  }

  renderAll() {
    const stops = [];

    for (let code in this.data.all) {
      const rank = this.data.all[code];
      if (rank) stops.push([code, this.getColor(rank)]);
    }

    this.map.addLayer({
      "id": "possibility-all",
      "type": "fill",
      "source": "vt",
      "source-layer": "distlict",
      "paint": {
        "fill-color": {
          "property": "code",
          "type": "categorical",
          "stops": stops,
          "default": "rgba(0, 0, 0, 0)"
        },
      }
    });
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
