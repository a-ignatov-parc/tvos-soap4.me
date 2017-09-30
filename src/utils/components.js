const { stringify } = JSON;

// eslint-disable-next-line import/prefer-default-export
export function deepEqualShouldUpdate(nextProps, nextState) {
  const propsAreEqual = stringify(this.props) === stringify(nextProps);
  const stateAreEqual = stringify(this.state) === stringify(nextState);

  return !propsAreEqual || !stateAreEqual;
}
