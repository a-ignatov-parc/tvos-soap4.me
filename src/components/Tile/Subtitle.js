import PropTypes from 'prop-types';

export default function Subtitle(props) {
  const {
    children,
    useBinding,
  } = props;

  return (
    <subtitle
      binding='textContent:{subtitle}'
      children={useBinding ? undefined : children}
      class='tile-subtitle'
    />
  );
}

Subtitle.propTypes = {
  children: PropTypes.string,
  useBinding: PropTypes.bool,
};

Subtitle.defaultProps = {
  useBinding: false,
};
