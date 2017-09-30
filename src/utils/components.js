export function deepEqualShouldUpdate(nextProps, nextState) {
  let propsAreEqual = JSON.stringify(this.props) === JSON.stringify(nextProps);
  let stateAreEqual = JSON.stringify(this.state) === JSON.stringify(nextState);

  return !propsAreEqual || !stateAreEqual;
}
