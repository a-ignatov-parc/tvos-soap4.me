import * as TVDML from 'tvdml';

import lifecycle from 'recompose/lifecycle';

import { link } from './utils';

function Hello(props) {
  const name = props.name || 'Human';
  const counter = props.counter || 0;

  return (
    <document>
      <head>
        <style>{`
          .title {
            tv-text-style: title1;
          }
        `}</style>
      </head>
      <alertTemplate>
        <title class='title'>Hello {name}!</title>
        <description>Nice to see you 😸</description>
        <button onSelect={link('next-page')}>
          <text>🎉</text>
        </button>
        <button>
          <text>🍸</text>
        </button>
        <text>And a small counter for your pleasure!</text>
        <text style='tv-text-style: title2'>
          {counter}
        </text>
      </alertTemplate>
    </document>
  );
}

const HelloCounter = lifecycle({
  componentWillMount() {
    this.setState({ counter: 0 });
  },

  componentDidMount() {
    this.timer = setInterval(() => {
      this.setState({ counter: this.state.counter + 1 });
    }, 5000);
  },

  componentWillUnmount() {
    this.timer && clearInterval(this.timer);
  },
})(Hello);

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(TVDML.renderReact(payload => (
    <HelloCounter name='Developer' />
  )));


TVDML
  .handleRoute('next-page')
  .pipe(TVDML.renderReact(payload => (
    <document>
      <loadingTemplate>
        <activityIndicator>
          <title style='tv-text-style: title1'>💃</title>
        </activityIndicator>
      </loadingTemplate>
    </document>
  )));
