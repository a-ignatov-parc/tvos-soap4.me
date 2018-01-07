import * as TVDML from 'tvdml';

import StoreProvider from './components/StoreProvider';

export function renderWithRuntime(renderFactory) {
  return TVDML
    .createPipeline()
    .pipe(TVDML.render(payload => (
      <StoreProvider>
        {renderFactory(payload)}
      </StoreProvider>
    )));
}

export function link(route, payload) {
  return () => TVDML.navigate(route, payload);
}
