import { connect } from 'react-redux';

export default connect(state => {
  return {
    baseUrl: state.app.baseUrl,
  };
});
