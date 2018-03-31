import { Fragment } from 'react';
import PropTypes from 'prop-types';

import Title from './Tile/Title';
import Poster from './Tile/Poster';
import Overlay from './Tile/Overlay';
import Subtitle from './Tile/Subtitle';
import BadgeUHD from './Tile/BadgeUHD';
import BadgeWatchedAll from './Tile/BadgeWatchedAll';
import BadgeWatchedCount from './Tile/BadgeWatchedCount';

/**
 * This list of rendering prototypes uses to render huge amount of data as fast
 * as posible using `DataItem` api (https://goo.gl/bWv4Dh).
 *
 * This prototypes mirrors all possible states of `Tile` component with
 * available data bindings.
 */
export default function TilePrototypes(props) {
  const { withSubtitle } = props;

  return (
    <Fragment>
      <lockup prototype='tvshow-tile-hd-not-watched'>
        <Poster useBinding />
        <Title useBinding />
        {withSubtitle && (
          <Subtitle useBinding />
        )}
        <Overlay />
      </lockup>
      <lockup prototype='tvshow-tile-uhd-not-watched'>
        <Poster useBinding showTopShadow />
        <Title useBinding />
        {withSubtitle && (
          <Subtitle useBinding />
        )}
        <Overlay>
          <BadgeUHD />
        </Overlay>
      </lockup>
      <lockup prototype='tvshow-tile-hd-watched-count'>
        <Poster useBinding showBottomShadow />
        <Title useBinding />
        {withSubtitle && (
          <Subtitle useBinding />
        )}
        <Overlay>
          <BadgeWatchedCount useBinding />
        </Overlay>
      </lockup>
      <lockup prototype='tvshow-tile-uhd-watched-count'>
        <Poster useBinding showTopShadow showBottomShadow />
        <Title useBinding />
        {withSubtitle && (
          <Subtitle useBinding />
        )}
        <Overlay>
          <BadgeUHD />
          <BadgeWatchedCount useBinding />
        </Overlay>
      </lockup>
      <lockup prototype='tvshow-tile-hd-watched-all'>
        <Poster useBinding showBottomShadow />
        <Title useBinding />
        {withSubtitle && (
          <Subtitle useBinding />
        )}
        <Overlay>
          <BadgeWatchedAll />
        </Overlay>
      </lockup>
      <lockup prototype='tvshow-tile-uhd-watched-all'>
        <Poster useBinding showTopShadow showBottomShadow />
        <Title useBinding />
        {withSubtitle && (
          <Subtitle useBinding />
        )}
        <Overlay>
          <BadgeUHD />
          <BadgeWatchedAll />
        </Overlay>
      </lockup>
    </Fragment>
  );
}

TilePrototypes.propTypes = {
  withSubtitle: PropTypes.bool,
};

TilePrototypes.defaultProps = {
  withSubtitle: false,
};
