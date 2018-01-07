import PropTypes from 'prop-types';

import Title from './Tile/Title';
import Poster from './Tile/Poster';
import Overlay from './Tile/Overlay';
import Subtitle from './Tile/Subtitle';
import BadgeUHD from './Tile/BadgeUHD';
import BadgeWatchedAll from './Tile/BadgeWatchedAll';
import BadgeWatchedCount from './Tile/BadgeWatchedCount';

export default function Tile(props) {
  const {
    isUHD,
    title,
    poster,
    counter,
    subtitle,
    isWatched,
    ...otherProps,
  } = props;

  return (
    <lockup {...otherProps}>
      <Poster
        src={poster}
        showTopShadow={isUHD}
        showBottomShadow={counter || isWatched}
      />
      <Title>{title}</Title>
      <Subtitle>{subtitle}</Subtitle>
      <Overlay>
        {isUHD && (
          <BadgeUHD />
        )}
        {!isWatched && counter && (
          <BadgeWatchedCount count={counter} />
        )}
        {isWatched && (
          <BadgeWatchedAll />
        )}
      </Overlay>
    </lockup>
  );
}

Tile.propTypes = {
  title: PropTypes.string.isRequired,
  poster: PropTypes.string.isRequired,
  isUHD: PropTypes.bool,
  isWatched: PropTypes.bool,
  counter: PropTypes.number,
  subtitle: PropTypes.string,
};

Tile.defaultProps = {
  isUHD: false,
  isWatched: false,
};
