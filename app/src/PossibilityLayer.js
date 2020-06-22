import mapboxgl from 'mapbox-gl';
import SelectedLayer from './SelectedLayer';

const types = {
  all: 'all',
  rain: '雨',
  snow: '雪',
  wind: '風（風雪）',
  wave: '波',
};


export default class PossibilityLayer {
  constructor(map, data, onSelected) {
    this.map = map;
    this.data = data;

    this.selected = {
      index: 0,
      type: 'all',
    };

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
    this.selected.index = index;
    this.render();
  }

  selectType(type) {
    this.selected.type = types[type];
    this.render();
  }


  // 
  render() {
    const { index, type } = this.selected;
    const length1 = this.data.tommorow.timeDefine.length;
    if (index === 0) {
      this.renderAll(type);

    } else if (index <= length1) {
      this.render1(type, index - 1);
    } else {
      this.render2(type, index - length1 - 1);
    }
  }

  renderAll(type) {
    if (type && type !== 'all') return this.renderAllType(type);
    const stops = [];

    for (let code in this.data.all) {
      const rank = this.data.all[code];
      if (rank) stops.push([code, this.getColor(rank)]);
    }
    this.renderLayer(stops);
  }

  render1(type, index) {
    const areas = this.data.tommorow.areas;
    const stops = [];

    for (let code in areas) {
      const rank = this.getRank(areas[code], type, index);
      console.log(rank);
      if (rank) stops.push([code, this.getColor(rank)]);
    }
    this.renderLayer(stops);
  }
  
  render2(type, index) {
    const areas1 = this.data.tommorow.areas;
    const areas2 = this.data.dayafter.areas;
    const stops = [];

    for (let code in areas1) {
      const prefCode = areas1[code].area.prefCode;
      const rank = this.getRank(areas2[prefCode], type, index);
      if (rank) stops.push([code, this.getColor(rank)]);
    }
    this.renderLayer(stops);
  }

  renderAllType(type) {
    const areas1 = this.data.tommorow.areas;
    const areas2 = this.data.dayafter.areas;
    const stops = [];

    for (let code in areas1) {
      const prefCode = areas1[code].area.prefCode;
      const p1 = areas1[code].possibility.find(p => p.type === type) || {};
      const p2 = areas2[prefCode].possibility.find(p => p.type === type) || {};
      const rank = this.getMaxRank([].concat(p1.rank, p2.rank));
      if (rank) stops.push([code, this.getColor(rank)]);
    }
    this.renderLayer(stops);

  }

  getRank(area, type, index) {
    if (type === 'all') {
      return area.possibilityAll[index];

    } else {
      const p = area.possibility.find(p => p.type === type);
      return p ? p.rank[index] : undefined;
    }
  }

  renderLayer(stops) {
    const fill = stops.length ? {
      "property": "code",
      "type": "categorical",
      "stops": stops,
      "default": "rgba(0, 0, 0, 0)"
    } : 'rgba(0, 0, 0, 0)';

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

  getMaxRank(ranks) {
    if (ranks.includes('高')) return '高'; 
    if (ranks.includes('中')) return '中';
    return null;
  }

  hover = (e) => {
    const features = this.map.queryRenderedFeatures(e.point, { layers: ['possibility'] });
    this.map.getCanvas().style.cursor = (features.length) ? 'crosshair' : '';

    let html;
    if (features.length) {
      console.log(features[0]);
      const code = features[0].properties.code; 
      const info = this.data.tommorow.areas[code];
      if (info) {
        html = info.text;
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
