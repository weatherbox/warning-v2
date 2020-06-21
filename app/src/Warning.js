import React, { Component } from 'react';

//import Sidebar from './Sidebar';
import SelectButton from './components/SelectButton';
import TypeDropdown from './components/TypeDropdown';
import PossibilityLayer from './PossibilityLayer';

const url = 'https://storage.googleapis.com/weather-warning/possibility.json';

export default class WeatherInfo extends Component {
  state = {
    data: null,
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
        this.setState({ data });
        this.data = data;
        this.addLayer();
      });
  }

  addLayer() {
    if (!this.map || !this.data) return;
    this.layer = new PossibilityLayer(this.map, this.data, this.onSelected);
  }

  render() {
    return <>
      <SelectButton
        data={this.state.data}
        onSelect={this.onSelectDatetime} />
      <TypeDropdown
        onSelect={this.onSelectType} />
    </>;
    /*
    return (
      <Sidebar
        data={this.state.info}
        ref={el => this.sidebar = el}
      />
    );
    */
  }

  onSelectDatetime = (index) => {
    this.layer.selectDatetime(index);
  }

  onSelectType = (type) => {
    this.layer.selectType(type);
  }
}
