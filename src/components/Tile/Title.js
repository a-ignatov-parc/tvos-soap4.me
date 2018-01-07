import PropTypes from 'prop-types';

export default function Title(props) {
  const {
    children,
    useBinding,
  } = props;

  return (
    <title
      binding='textContent:{title}'
      children={useBinding ? undefined : children}
      class='tile-title'
    />
  );
}

Title.propTypes = {
  children: PropTypes.string,
  useBinding: PropTypes.bool,
};

Title.defaultProps = {
  useBinding: false,
};
