export default function createMolecule(envelope) {
  const {
    reducer = () => null,
    middleware = store => next => action => next(action),
  } = envelope;

  return function moleculePatternMatcher(...args) {
    const [store, action] = args;

    const isReducer = action != null
      && typeof action === 'object'
      && 'type' in action;

    const isMiddleware = store != null
      && typeof store === 'object'
      && typeof store.dispatch === 'function';

    if (isReducer) return reducer.apply(this, args);
    if (isMiddleware) return middleware.apply(this, args);

    console.error('Unknown pattern', args);

    return undefined;
  };
}
