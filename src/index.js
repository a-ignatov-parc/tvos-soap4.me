import * as TVDML from 'tvdml';

import {
  launchApp,
  resumeApp,
  suspendApp,
} from './redux/molecules/app';

import store from './redux/store';

import { renderWithRuntime } from './utils';

import Main, {
  USER,
  GUEST,
  Menu,
  MenuItem,
} from './screens/Main';

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
          Search
        </MenuItem>
        <MenuItem
          route='my'
          activeFor={USER}
          hiddenFor={GUEST}
        >
          My
        </MenuItem>
        <MenuItem
          route='all'
          activeFor={GUEST}
        >
          All
        </MenuItem>
        <MenuItem route='settings'>
          Settings
        </MenuItem>
      </Menu>
    </Main>
  )));
