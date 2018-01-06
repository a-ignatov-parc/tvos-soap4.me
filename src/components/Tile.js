import PropTypes from 'prop-types';

export default function Tile(props) {
  const {
    title,
    poster,
  } = props;

  return (
    <lockup>
      <img
        src={poster}
        width='250'
        height='250'
      />
      <title>
        {title}
      </title>
    </lockup>
  );
}

Tile.propTypes = {
  title: PropTypes.string.isRequired,
  poster: PropTypes.string.isRequired,
};

Tile.defaultProps = {
  // useBindings: false,
};
