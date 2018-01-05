import * as TVDML from 'tvdml';

import {
  launchApp,
  resumeApp,
  suspendApp,
} from './redux/molecules/app';

import store from './redux/store';

import { renderWithRuntime } from './utils';

import Main, {Menu, MenuItem} from './screens/Main';

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
        <MenuItem route='page1'>
          Page1
        </MenuItem>
      </Menu>
    </Main>
  )));
