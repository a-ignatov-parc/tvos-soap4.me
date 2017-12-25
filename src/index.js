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
        <button onSelect={link('page2')}>
          <text>🎉</text>
        </button>
        <button onSelect={showMessage}>
          <text>🍸</text>
        </button>
        <text>And a small counter for your pleasure!</text>
        <text style={{ tvTextStyle: 'title2' }}>
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
        <title style={{ tvTextStyle: 'title1' }}>💃</title>
        <text>And here is a global counter!</text>
        <text style={{ tvTextStyle: 'title2' }}>
          {counter}
        </text>
        <button onSelect={showMessage}>
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
  .pipe(TVDML.passthrough(() => new Promise(resolve => {
    setInterval(() => {
      store.dispatch({ type: INCREMENT });
      resolve();
    }, 5000);
  })))
  .pipe(TVDML.render(payload => (
    <document>
      <menuBarTemplate>
        <menuBar>
          <menuItem route='page1'>
            <title>Page1</title>
          </menuItem>
          <menuItem route='page2' autoHighlight>
            <title>Page2</title>
          </menuItem>
          <menuItem route='page3'>
            <title>Page3</title>
          </menuItem>
        </menuBar>
      </menuBarTemplate>
    </document>
  )));

TVDML
  .handleRoute('page1')
  .pipe(TVDML.render(payload => (
    <Provider store={store}>
      <ConnectedScreen1 name='Developer' />
    </Provider>
  )));


TVDML
  .handleRoute('page2')
  .pipe(TVDML.render(payload => (
    <Provider store={store}>
      <ConnectedScreen2 />
    </Provider>
  )));

const mockData = [
  {
    title: 'Arrow, Season 1',
    url: 'http://is2.mzstatic.com/image/thumb/Music6/v4/e9/bb/9b/e9bb9bbb-16c0-d946-063d-15632dd78a76/source/600x600bb.jpg',
  },
  {
    title: 'Arrow, Season 2',
    url: 'http://is1.mzstatic.com/image/thumb/Music3/v4/bb/87/84/bb8784ca-7e31-0cc1-b56d-9243624863d3/source/600x600bb.jpg',
  },
  {
    title: 'Arrow, Season 3',
    url: 'http://is2.mzstatic.com/image/thumb/Video62/v4/ec/ca/78/ecca78a3-5bb0-0b32-954c-f7fd966582ab/source/600x600bb.jpg',
  },
];

TVDML
  .handleRoute('page3')
  .pipe(TVDML.render(payload => (
    <document>
      <stackTemplate>
        <banner>
          <title>TV Shows</title>
        </banner>
        <collectionList>
          <shelf>
            <prototypes>
              <lockup prototype='tvshow'>
                <img
                  binding='@src:{url};'
                  width='300'
                  height='300'
                />
                <title binding='textContent:{title};' />
              </lockup>
            </prototypes>
            <section
              binding='items:{tvshows};'
              dataItem={{
                tvshows: mockData.map((cover, i) => {
                  const item = new DataItem('tvshow', i);

                  item.url = cover.url;
                  item.title = cover.title;

                  return item;
                }),
              }}
            />
          </shelf>
        </collectionList>
      </stackTemplate>
    </document>
  )));
