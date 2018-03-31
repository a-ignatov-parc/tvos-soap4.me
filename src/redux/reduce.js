export default function stateReducer(defaultState = {}, actionMapper = {}) {
  return function stateResolver(state = defaultState, action = {}) {
    const actionReducer = actionMapper[action.type];

    if (typeof actionReducer === 'function') {
      return {
        ...state,
        ...actionReducer(state, action),
      };
    }

    return state;
  }
}
