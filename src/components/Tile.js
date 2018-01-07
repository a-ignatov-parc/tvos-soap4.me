import PropTypes from 'prop-types';

import Title from './Tile/Title';
import Poster from './Tile/Poster';
import Overlay from './Tile/Overlay';
import Subtitle from './Tile/Subtitle';
import BadgeUHD from './Tile/BadgeUHD';
import BadgeWatchedAll from './Tile/BadgeWatchedAll';
import BadgeWatchedCount from './Tile/BadgeWatchedCount';

/**
 * Don't forget to update `TilePrototypes` component if you add or change some
 * presentation. It's not very convenient but rendering with `DataItem` api is
 * the most performant way to render huge amount of items.
 *
 * More info here:
 * https://goo.gl/bWv4Dh
 */
export default function Tile(props) {
  const {
    isUHD,
    title,
    count,
    poster,
    subtitle,
    isWatched,
    ...otherProps,
  } = props;

  return (
    <lockup {...otherProps}>
      <Poster
        src={poster}
        showTopShadow={isUHD}
        showBottomShadow={count || isWatched}
      />
      <Title>{title}</Title>
      <Subtitle>{subtitle}</Subtitle>
      <Overlay>
        {isUHD && (
          <BadgeUHD />
        )}
        {!isWatched && count && (
          <BadgeWatchedCount count={count} />
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
  count: PropTypes.number,
  subtitle: PropTypes.string,
  isUHD: PropTypes.bool,
  isWatched: PropTypes.bool,
};

Tile.defaultProps = {
  isUHD: false,
  isWatched: false,
};
