/* global Device */

import stateReducer from '../reduce';
import createMolecule from '../molecule';

const defaultState = {
  UHD: Device.productType !== 'AppleTV5,3',
};

const reducer = stateReducer(defaultState);

export default createMolecule({ reducer });
