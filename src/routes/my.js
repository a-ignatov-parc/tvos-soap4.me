import moment from 'moment';
import * as TVDML from 'tvdml';

import * as user from '../user';
import {get as i18n} from '../localization';

import {
  getMyTVShows,
  getMySchedule,
} from '../request/soap';

import {link, isMenuButtonPressNavigatedTo} from '../utils';
import {deepEqualShouldUpdate} from '../utils/components';

import Tile from '../components/tile';
import Loader from '../components/loader';

import commonStyles from '../common/styles';

const {Promise} = TVDML;

export default function() {
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
        const currentDocument = this._rootNode.ownerDocument;

        this.menuButtonPressStream = TVDML.subscribe('menu-button-press');
        this.menuButtonPressStream
          .pipe(isMenuButtonPressNavigatedTo(currentDocument))
          .pipe(isNavigated => isNavigated && this.loadData().then(this.setState.bind(this)));

        this.userStateChangeStream = user.subscription();
        this.userStateChangeStream.pipe(() => {
          const token = user.getToken();

          if (token !== this.state.token) {
            this.setState({updating: true, token});
          }
        });

        this.appResumeStream = TVDML.subscribe(TVDML.event.RESUME);
        this.appResumeStream.pipe(() => this.loadData().then(this.setState.bind(this)));

        this.loadData().then(payload => {
          this.setState({loading: false, ...payload});
        });
      },

      componentWillReceiveProps(nextProps) {
        this.setState({updating: true});
      },

      componentDidUpdate(prevProps, prevState) {
        if (this.state.updating && prevState.updating !== this.state.updating) {
          this.loadData().then(payload => {
            this.setState({updating: false, ...payload});
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
          .then(([series, schedule]) => ({series, schedule}));
      },

      render() {
        if (this.state.loading) {
          return <Loader />;
        }

        if (!this.state.series.length) {
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

        let watching = this.state.series.filter(({watching}) => watching > 0);
        let others = this.state.series.filter(({watching}) => watching < 1);

        let ongoing = watching.filter(({status, unwatched}) => status == 0 || unwatched > 0);
        let unwatched = ongoing.filter(({unwatched}) => unwatched > 0);
        let watched = ongoing.filter(({unwatched}) => !unwatched);
        let closed = watching.filter(({status, unwatched}) => status > 0 && !unwatched);

        return (
          <document>
            <stackTemplate>
              <banner>
                <title>
                  {i18n('my-caption')}
                </title>
              </banner>
              <collectionList>
                {unwatched.length && this.renderSectionGrid(unwatched, 'my-new-episodes')}
                {watched.length && this.renderSectionGrid(watched, 'my-watched', this.state.schedule)}
                {closed.length && this.renderSectionGrid(closed, 'my-closed')}
              </collectionList>
            </stackTemplate>
          </document>
        );
      },

      renderSectionGrid(collection, title, schedule = []) {
        let header;
        let scheduleDictionary = schedule.reduce((result, item) => {
          result[item.sid] = item;
          return result;
        }, {});

        if (title) {
          header = (
            <header>
              <title>
                {i18n(title)}
              </title>
            </header>
          )
        }

        let currentMoment = moment();
        let nextDay = currentMoment.clone().add(moment.relativeTimeThreshold('h'), 'hour');
        let nextMonth = currentMoment.clone().add(moment.relativeTimeThreshold('d'), 'day');

        return (
          <grid>
            {header}
            <section>
              {collection.map(tvshow => {
                let {
                  sid,
                  unwatched,
                  covers: {big: poster},
                } = tvshow;

                let title = i18n('tvshow-title', tvshow);
                let scheduleEpisode = scheduleDictionary[sid];
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
                    dateTitle = i18n('new-episode-custom-date', {date: date.fromNow()});
                  }
                  currentMoment < date && (isWatched = false);
                }

                return (
                  <Tile
                    key={sid}
                    title={title}
                    route="tvshow"
                    poster={poster}
                    counter={unwatched || dateTitle}
                    isWatched={isWatched}
                    payload={{title, sid, poster}}
                  />
                );
              })}
            </section>
          </grid>
        );
      },
    })));
}
