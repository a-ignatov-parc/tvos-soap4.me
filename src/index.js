import * as TVDML from 'tvdml';

import store from './redux/store';

import {
  launchApp,
  resumeApp,
  suspendApp,
} from './redux/molecules/app';

import { renderWithRuntime } from './utils';

import Main, {
  USER,
  GUEST,
  Menu,
  MenuItem,
} from './screens/Main';

import All from './screens/All';
import Auth from './screens/Auth';

import Text from './components/Text';

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(params => store.dispatch(launchApp(params)));

TVDML
  .subscribe(TVDML.event.SUSPEND)
  .pipe(() => store.dispatch(suspendApp()));

TVDML
  .subscribe(TVDML.event.RESUME)
  .pipe(() => store.dispatch(resumeApp()));

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(renderWithRuntime(() => (
    <Main>
      <Menu>
        <MenuItem route='search'>
          <Text i18n='menu-search' />
        </MenuItem>
        <MenuItem
          route='my'
          activeFor={USER}
          hiddenFor={GUEST}
        >
          <Text i18n='menu-my' />
        </MenuItem>
        <MenuItem
          route='all'
          activeFor={GUEST}
        >
          <Text i18n='menu-all' />
        </MenuItem>
        <MenuItem route='settings'>
          <Text i18n='menu-settings' />
        </MenuItem>
      </Menu>
    </Main>
  )));

TVDML
  .handleRoute('all')
  .pipe(renderWithRuntime(() => (
    <All />
  )));

TVDML
  .handleRoute('tvshow')
  .pipe(renderWithRuntime(() => (
    <Auth />
  )));

TVDML
  .handleRoute('search')
  .pipe(renderWithRuntime(() => (
    <document>
      <alertTemplate>
        <title>Search</title>
      </alertTemplate>
    </document>
  )));
