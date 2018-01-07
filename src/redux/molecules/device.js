/* global Device, Settings */

import stateReducer from '../reduce';
import createMolecule from '../molecule';

const defaultState = {
  supportUHD: Device.productType !== 'AppleTV5,3',
  systemLanguage: Settings.language,
};

const reducer = stateReducer(defaultState);

export default createMolecule({ reducer });
