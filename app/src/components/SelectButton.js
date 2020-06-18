import React, { Component } from 'react';
import { Button } from 'semantic-ui-react';

import './SelectButton.css';

export default class SelectButton extends Component {
  state = { times: null, selected: 0 };

  componentDidUpdate(prevProps) {
    if (this.props.data != prevProps.data) {
      const times = this.getTimes();
      this.setState({ times });
    }
  }

  render() {
    if (!this.state.times) return null;
    return (
      <Button.Group inverted className="select-button">
        {this.state.times.map((time, i) => (
          <Button
            inverted size="small"
            key={i}
            onClick={() => this.onSelect(i)}
            active={i === this.state.selected}
          >
            {time}
          </Button>
        ))}:
      </Button.Group>
    );
  }

  onSelect(i) {
    this.setState({ selected: i });
    this.props.onSelect(i);
  }

  getTimes() {
    const times = ['すべて'];

    this.props.data.tommorow.timeDefine.forEach(def => {
      const text = this.pt(def);
      times.push(text);
    });

    this.props.data.dayafter.timeDefine.forEach(def => {
      times.push(new Date(def.datetime).getDate() + '日');
    });

    return times;
  }

  pt(def) {
    const hours = parseInt(def.duration.substr(2).replace('H', ''));
    const from = new Date(def.datetime);
    const to = new Date(from.getTime() + hours * 3600 * 1000);
    const toH = to.getHours() || 24;
    return `${from.getDate()}日${from.getHours()}-${toH}`;
  }
}
