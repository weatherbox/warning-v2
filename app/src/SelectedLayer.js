export default class SelectedLayer {
  constructor(map, onSelected) {
    this.map = map;
    this.onSelected = onSelected;

    this.addSelectedLayer();
    this.map.on('click', 'weather-info-pref', (e) => {
      this.onClick(e);
    });
  }

  addSelectedLayer() {
    this._addSelectedLayer('pref');
    this._addSelectedLayer('distlict');
  }
  
  _addSelectedLayer(type) {
    this.map.addLayer({
      "id": type + "-line-selected",
      "type": "line",
      "source": "vt",
      "source-layer": type,
      "paint": {
        "line-color": "rgba(70, 171, 199, 0.8)",
        "line-width": 1
      },
      filter: ["==", "code", "0"]
    });
  }

  onClick(e) {
    if (e.features) {
      console.log(e.features[0].properties);
      const { code, name } = this.getCode(e.features[0].properties.code);
      const prefName = name || e.features[0].properties.name;
      this.selectPref(code);
      this.onSelected(code, prefName);
    }
  }
  
  select(type, codes) {
    ['pref', 'distlict', 'region'].forEach(l => {
      const filter = l === type ? codes : ['0'];
      this.map.setFilter(l + '-line-selected', ['in', 'code', ...filter]);
    });
  }
}
