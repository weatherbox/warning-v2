import React, { Component } from 'react';
import { Dropdown, Menu } from 'semantic-ui-react';

import './TypeDropdown.css';

export default class TypeDropdown extends Component {
  state = { value: 'all' };

  handleChange = (e, { value }) => {
    this.setState({ value });
    this.props.onSelect(value);
  }

  types = [
    { key: 0, text: 'すべて', value: 'all' },
    { key: 1, text: '大雨', value: 'rain' },
    { key: 2, text: '暴風', value: 'wind' },
    { key: 3, text: '波浪', value: 'wave' },
    { key: 4, text: '大雪', value: 'snow' },
  ];

  render() {
    return (
      <Menu compact inverted className="type-dropdown">
        <Dropdown
          options={this.types}
          value={this.state.value}
          onChange={this.handleChange}
          item
        />
      </Menu>
    );
  }
}
