import moment from 'moment';
import * as TVDML from 'tvdml';

import * as user from '../user';
import { get as i18n } from '../localization';

import {
  getMyTVShows,
  getMySchedule,
} from '../request/soap';

import { link, isMenuButtonPressNavigatedTo } from '../utils';
import { deepEqualShouldUpdate } from '../utils/components';

import Tile from '../components/tile';
import Loader from '../components/loader';

import commonStyles from '../common/styles';

export default function myRoute() {
  return TVDML
    .createPipeline()
    .pipe(TVDML.render(TVDML.createComponent({
      getInitialState() {
        const token = user.getToken();
        const authorized = user.isAuthorized();

        return {
          token,
          authorized,
          updating: false,
          loading: !!authorized,
        };
      },

      componentDidMount() {
        const setState = this.setState.bind(this);

        // eslint-disable-next-line no-underscore-dangle
        const currentDocument = this._rootNode.ownerDocument;

        this.menuButtonPressStream = TVDML.subscribe('menu-button-press');
        this.menuButtonPressStream
          .pipe(isMenuButtonPressNavigatedTo(currentDocument))
          .pipe(isNavigated => isNavigated && this.loadData().then(setState));

        this.userStateChangeStream = user.subscription();
        this.userStateChangeStream.pipe(() => {
          const token = user.getToken();

          if (token !== this.state.token) {
            this.setState({ updating: true, token });
          }
        });

        this.appResumeStream = TVDML.subscribe(TVDML.event.RESUME);
        this.appResumeStream.pipe(() => this.loadData().then(setState));

        this.loadData().then(payload => {
          this.setState({ loading: false, ...payload });
        });
      },

      componentWillReceiveProps() {
        this.setState({ updating: true });
      },

      componentDidUpdate(prevProps, prevState) {
        if (this.state.updating && prevState.updating !== this.state.updating) {
          this.loadData().then(payload => {
            this.setState({ updating: false, ...payload });
          });
        }
      },

      componentWillUnmount() {
        this.menuButtonPressStream.unsubscribe();
        this.userStateChangeStream.unsubscribe();
        this.appResumeStream.unsubscribe();
      },

      shouldComponentUpdate: deepEqualShouldUpdate,

      loadData() {
        if (!user.isAuthorized()) {
          return Promise.resolve({});
        }

        return Promise
          .all([
            getMyTVShows(),
            getMySchedule(),
          ])
          .then(([series, schedule]) => ({ series, schedule }));
      },

      render() {
        const {
          series,
          loading,
          schedule,
        } = this.state;

        if (loading) {
          return <Loader />;
        }

        if (!series.length) {
          return (
            <document>
              <head>
                {commonStyles}
              </head>
              <alertTemplate>
                <title class="grey_text">
                  {i18n('my-empty-list-title')}
                </title>
                <description class="grey_description">
                  {i18n('my-empty-list-description')}
                </description>
                <button onSelect={link('all')}>
                  <text>
                    {i18n('my-empty-list-button')}
                  </text>
                </button>
              </alertTemplate>
            </document>
          );
        }

        const watching = series.filter(item => item.watching > 0);

        // eslint-disable-next-line arrow-body-style
        const ongoing = watching.filter(item => {
          // eslint-disable-next-line eqeqeq
          return item.status == 0 || item.unwatched > 0;
        });

        const unwatched = ongoing.filter(item => item.unwatched > 0);
        const watched = ongoing.filter(item => !item.unwatched);

        // eslint-disable-next-line arrow-body-style
        const closed = watching.filter(item => {
          return item.status > 0 && !item.unwatched;
        });

        return (
          <document>
            <stackTemplate>
              <banner>
                <title>
                  {i18n('my-caption')}
                </title>
              </banner>
              <collectionList>
                {unwatched.length && (
                  this.renderSectionGrid(unwatched, 'my-new-episodes')
                )}
                {watched.length && (
                  this.renderSectionGrid(watched, 'my-watched', schedule)
                )}
                {closed.length && (
                  this.renderSectionGrid(closed, 'my-closed')
                )}
              </collectionList>
            </stackTemplate>
          </document>
        );
      },

      renderSectionGrid(collection, title, schedule = []) {
        const scheduleDictionary = schedule.reduce((result, item) => {
          // eslint-disable-next-line no-param-reassign
          result[item.sid] = item;
          return result;
        }, {});

        const currentMoment = moment();

        const nextDay = currentMoment
          .clone()
          .add(moment.relativeTimeThreshold('h'), 'hour');

        const nextMonth = currentMoment
          .clone()
          .add(moment.relativeTimeThreshold('d'), 'day');

        return (
          <grid>
            {title && (
              <header>
                <title>
                  {i18n(title)}
                </title>
              </header>
            )}
            <section>
              {collection.map(tvshow => {
                const {
                  sid,
                  unwatched,
                  covers: { big: poster },
                } = tvshow;

                const isUHD = !!tvshow['4k'];
                const tvShowTitle = i18n('tvshow-title', tvshow);
                const scheduleEpisode = scheduleDictionary[sid];

                let isWatched = !unwatched;
                let dateTitle;
                let date;

                if (scheduleEpisode) {
                  date = moment(scheduleEpisode.date, 'DD.MM.YYYY');

                  if (!date.isValid() || nextMonth < date) {
                    dateTitle = i18n('new-episode-soon');
                  } else if (nextDay > date) {
                    dateTitle = i18n('new-episode-day');
                  } else {
                    dateTitle = i18n('new-episode-custom-date', {
                      date: date.fromNow(),
                    });
                  }
                  if (currentMoment < date) isWatched = false;
                }

                return (
                  <Tile
                    key={sid}
                    title={tvShowTitle}
                    route="tvshow"
                    poster={poster}
                    counter={unwatched || dateTitle}
                    isWatched={isWatched}
                    isUHD={isUHD}
                    payload={{
                      sid,
                      poster,
                      title: tvShowTitle,
                    }}
                  />
                );
              })}
            </section>
          </grid>
        );
      },
    })));
}
