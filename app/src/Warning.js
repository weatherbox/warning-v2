import React, { Component } from 'react';

//import Sidebar from './Sidebar';
import PossibilityLayer from './PossibilityLayer';

const url = 'https://storage.googleapis.com/weather-warning/possibility.json';

export default class WeatherInfo extends Component {
  state = {
    info: null,
  };

  componentDidMount() {
    this.loadWeatherInfo();
  }

  onload(map) {
    this.map = map;
    this.addLayer();
  }
  
  loadWeatherInfo() {
    const timestamp = new Date().getTime();
    fetch(url + '?' + timestamp, {mode: 'cors'})
      .then(res => res.json())
      .then(data => {
        console.log(data);
        this.setState({ info: data });
        this.data = data;
        this.addLayer();
      });
  }

  addLayer() {
    if (!this.map || !this.data) return;
    this.layer = new PossibilityLayer(this.map, this.data, this.onSelected);
  }

  render() {
    return null;
    /*
    return (
      <Sidebar
        data={this.state.info}
        ref={el => this.sidebar = el}
      />
    );
    */
  }

  onSelected = (code, prefName) => {
    this.sidebar.showPref(code, prefName);
  }
}
