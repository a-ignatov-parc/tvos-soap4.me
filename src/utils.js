import * as TVDML from 'tvdml';

import StoreProvider from './components/StoreProvider';

export function renderWithRuntime(Component) {
  return TVDML
    .createPipeline()
    .pipe(TVDML.render(() => (
      <StoreProvider>
        <Component />
      </StoreProvider>
    )));
}
