import * as TVDML from 'tvdml';

import { request } from '../request';
import {
  getSpeedTestServers,
  saveSpeedTestResults,
} from '../request/soap';

import { get as i18n } from '../localization';

import { noop, getStartParams } from '../utils';

import Loader from '../components/loader';

const flagsContext = require.context('../assets/countries', false, /\.png$/);
const flags = flagsContext
  .keys()
  .reduce((result, moduleName) => {
    const name = moduleName.replace(/^\.\/|\.png$/g, '');

    // eslint-disable-next-line no-param-reassign
    result[name] = flagsContext(moduleName).default;
    return result;
  }, {});

const { Promise } = TVDML;

const fileSize = 10567604;

function createLoader(id, file, resolver = noop()) {
  const start = Date.now();

  return request(file, {
    prepare(xhr) {
      resolver(xhr);
      return xhr;
    },
  }).then(() => {
    const end = Date.now();
    const diff = end - start;
    const seconds = diff / 1000;
    const speed = (fileSize / seconds) / 102400;
    const prettifiedSpeed = speed.toFixed(2);

    return { [id]: prettifiedSpeed };
  });
}

export default function speedTestRoute() {
  return TVDML
    .createPipeline()
    .pipe(TVDML.render(TVDML.createComponent({
      getInitialState() {
        return {
          results: {},
          skipped: {},
          progress: 0,
          servers: null,
          loading: true,
          running: false,
        };
      },

      componentDidMount() {
        // To improuve UX on fast request we are adding rendering timeout.
        const waitForAnimations = new Promise(done => setTimeout(done, 500));

        Promise
          .all([getSpeedTestServers(), waitForAnimations])
          .then(([servers]) => this.setState({ loading: false, servers }));
      },

      render() {
        const { BASEURL } = getStartParams();

        const {
          running,
          results,
          skipped,
          loading,
          servers,
          progress,
        } = this.state;

        if (loading) {
          return (
            <Loader title={i18n('speedtest-loading')} />
          );
        }

        const serversList = Object
          .keys(servers)
          .map(id => ({ id, file: servers[id] }));

        return (
          <document>
            <stackTemplate>
              <banner>
                <title>
                  {i18n('speedtest-caption')}
                </title>
              </banner>
              <collectionList>
                <shelf
                  centered="true"
                  style="tv-interitem-spacing: 60; margin: 228 0 0"
                >
                  <section>
                    {serversList.map(({ id }) => {
                      let result = '...';

                      if (skipped[id]) {
                        result = i18n('speedtest-result-too-slow');
                      } else if (results[id]) {
                        result = i18n('speedtest-result', {
                          speed: results[id],
                        });
                      }

                      return (
                        <lockup key={id} disabled="true">
                          <title style="margin: 0 0 10">
                            {i18n(`speedtest-country-${id}`)}
                          </title>
                          <img
                            width="298"
                            height="200"
                            src={BASEURL + flags[id]}
                          />
                          <subtitle style="margin: 10 0 0">{result}</subtitle>
                          <overlay style="margin: 0; padding: 0;">
                            {(results[id] || skipped[id]) && (
                              <badge
                                src="resource://button-checkmark"
                                style="tv-position: center; tv-align: center"
                              />
                            )}
                            {running === id && (
                              <progressBar value={progress / 100} />
                            )}
                          </overlay>
                        </lockup>
                      );
                    })}
                  </section>
                </shelf>
                <row style="tv-align: center">
                  {running ? (
                    <text
                      style="tv-text-style: headline; color: rgb(84, 82, 80)"
                    >
                      {i18n('speedtest-testing')}
                    </text>
                  ) : (
                    <button onSelect={this.onStart}>
                      <text>
                        {i18n('speedtest-begin')}
                      </text>
                    </button>
                  )}
                </row>
              </collectionList>
            </stackTemplate>
          </document>
        );
      },

      onStart() {
        if (this.state.running) return;

        let chain = Promise.resolve({});

        Object
          .keys(this.state.servers)
          .forEach(id => {
            chain = chain.then(results => {
              let requestToServer;

              this.setState({
                results,
                running: id,
                progress: 0,
              });

              const timer = setInterval(() => {
                if (this.state.progress >= 100) {
                  requestToServer.abort();
                } else {
                  this.setState({ progress: this.state.progress + 1 });
                }
              }, 300);

              return createLoader(id, this.state.servers[id], xhr => {
                requestToServer = xhr;
                return xhr;
              })
                .then(result => {
                  clearInterval(timer);
                  return {
                    ...results,
                    ...result,
                  };
                })
                .catch(() => {
                  clearInterval(timer);
                  this.setState({
                    skipped: {
                      [id]: true,
                      ...this.state.skipped,
                    },
                  });
                  return {
                    [id]: (1).toFixed(2),
                    ...results,
                  };
                });
            });
          });

        chain
          .then(results => {
            this.setState({
              results,
              progress: 0,
              running: false,
            });
            return results;
          })
          .then(saveSpeedTestResults);
      },
    })));
}
