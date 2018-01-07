import PropTypes from 'prop-types';

export default function Title(props) {
  const {
    binding,
    children,
  } = props;

  return (
    <title
      binding='textContent:{title}'
      children={binding ? undefined : children}
      class='tile-title'
    />
  );
}

Title.propTypes = {
  binding: PropTypes.bool,
  children: PropTypes.string,
};

Title.defaultProps = {
  binding: false,
};
