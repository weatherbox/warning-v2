import mapboxgl from 'mapbox-gl';
import SelectedLayer from './SelectedLayer';


export default class PossibilityLayer {
  constructor(map, data, period, onSelected) {
    this.map = map;
    this.weatherInfo = data;
    this.period = period;

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
    return;
    this.renderWeatherInfoPrefs();
 
    this.addRegion();
    this.selectedLayer =  new SelectedLayer(map, onSelected);

    this.popup = new mapboxgl.Popup({
      closeButton: false
    });
    this.map.on('mousemove', this.hover);
  }

  selectRegion(code) {
    this.selectedLayer.selectRegion(code);
  }

  addRegion() {
    this.map.addSource("region-vt", {
      "type": "vector",
      "minzoom": 0,
      "maxzoom": 8,
      "tiles": ["https://weatherbox.github.io/warning-area-vt/region/{z}/{x}/{y}.pbf"]
    });
  }


  renderWeatherInfoPrefs() {
    const stops = [];

    this.map.addLayer({
      "id": "weather-info-pref",
      "type": "fill",
      "source": "vt",
      "source-layer": "pref",
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


  getColor(count) {
    const opacity = Math.min(0.1 + 0.05 * count, 0.8);
    return `rgba(70, 171, 199, ${opacity})`;
  }

  hover = (e) => {
    const features = this.map.queryRenderedFeatures(e.point, { layers: ['weather-info-pref', 'weather-info-tokyo'] });
    this.map.getCanvas().style.cursor = (features.length) ? 'crosshair' : '';

    let html;
    if (features.length) {
      const code = this.getCode(features[0].properties.code);
      const infos = this.weatherInfo.prefs[code];
      if (infos) {
        const title = infos[0].title.split('に関する')[0];
        html = title + '<br/><span>' + this.getTimeBefore(infos[0]) + '</span>';
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
