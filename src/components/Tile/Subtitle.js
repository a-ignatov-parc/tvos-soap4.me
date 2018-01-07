import PropTypes from 'prop-types';

export default function Subtitle(props) {
  const {
    binding,
    children,
  } = props;

  return (
    <subtitle
      binding='textContent:{subtitle}'
      children={binding ? undefined : children}
      class='tile-subtitle'
    />
  );
}

Subtitle.propTypes = {
  binding: PropTypes.bool,
  children: PropTypes.string,
};

Subtitle.defaultProps = {
  binding: false,
};
