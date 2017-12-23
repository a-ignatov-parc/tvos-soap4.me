import * as TVDML from 'tvdml';

import { createStore } from 'redux';
import { connect, Provider } from 'react-redux';

import { link } from './utils';

const INCREMENT = 'increment';

function counter(state = 0, action) {
  switch (action.type) {
    case INCREMENT:
      return state + 1;
    default:
      return state;
  }
}

const store = createStore(counter);

function showMessage() {
  TVDML
    .renderModal(payload => (
      <document>
        <alertTemplate>
          <title>😯</title>
          <button onSelect={TVDML.removeModal}>
            <text>Close</text>
          </button>
        </alertTemplate>
      </document>
    ))
    .sink();
}

function Screen1(props) {
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
        <button onSelect={showMessage}>
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

function Screen2(props) {
  const counter = props.counter || 0;

  return (
    <document>
      <alertTemplate>
        <title style='tv-text-style: title1'>💃</title>
        <text>And here is a global counter!</text>
        <text style='tv-text-style: title2'>
          {counter}
        </text>
        <button onSelect={() => navigationDocument.popDocument()}>
          <text>🚗</text>
        </button>
      </alertTemplate>
    </document>
  );
}

const withCounter = connect(state => ({ counter: state }));

const ConnectedScreen1 = withCounter(Screen1);
const ConnectedScreen2 = withCounter(Screen2);

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(TVDML.render(payload => (
    <document>
      <loadingTemplate>
        <activityIndicator>
          <title>🤔</title>
        </activityIndicator>
      </loadingTemplate>
    </document>
  )))
  .pipe(TVDML.passthrough(() => {
    return new Promise(resolve => {
      setInterval(() => {
        store.dispatch({ type: INCREMENT });
        resolve();
      }, 5000);
    });
  }))
  .pipe(TVDML.render(payload => (
    <Provider store={store}>
      <ConnectedScreen1 name='Developer' />
    </Provider>
  )));


TVDML
  .handleRoute('next-page')
  .pipe(TVDML.render(payload => (
    <Provider store={store}>
      <ConnectedScreen2 />
    </Provider>
  )));
