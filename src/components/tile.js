import { link } from '../utils';

export default function Tile({ key, attrs = {}, events = {} }) {
  const {
    route,
    title,
    poster,
    counter,
    subtitle,
    isUHD,
    isWatched,
    payload = {},
    autoHighlight,
  } = attrs;

  const {
    onPlay,
    onSelect,
    onHighlight,
    onHoldselect,
  } = events;

  const showTopShadow = isUHD;
  const showBottomShadow = counter || isWatched;

  return (
    <lockup
      key={key}
      onPlay={onPlay}
      onSelect={onSelect || link(route, payload)}
      onHighlight={onHighlight}
      onHoldselect={onHoldselect}
      autoHighlight={autoHighlight ? 'true' : undefined}
    >
      <img
        src={poster}
        width="250"
        height="250"
        class="tile-img"
        style={`
          tv-placeholder: tv;
          tv-tint-color: linear-gradient(
            top,
            rgba(0, 0, 0, ${showTopShadow ? '0.5' : '0'})
            0.2,
            transparent,
            0.8,
            transparent,
            rgba(0, 0, 0, ${showBottomShadow ? '0.5' : '0'})
          );
        `}
      />
      <title
        class="tile-title"
        style="tv-text-highlight-style: marquee-on-highlight"
      >{title}</title>
      <subtitle class="tile-subtitle">{subtitle}</subtitle>
      <overlay style="margin: 0; padding: 0;">
        {isUHD && (
          <badge
            src="resource://4k"
            style={`
              margin: 12 10 0 0;
              tv-align: right;
              tv-position: top;
              tv-tint-color: rgb(255, 255, 255);
              tv-highlight-color: rgb(255, 255, 255);
            `}
          />
        )}
        {!isWatched && counter && (
          <textBadge
            type="fill"
            style={`
              font-size: 20;
              border-radius: 30;
              margin: 0 10 12 0;
              padding: 1 8;
              tv-align: right;
              tv-position: bottom;
              tv-tint-color: rgb(255, 255, 255);
            `}
          >{counter}</textBadge>
        )}
        {isWatched && (
          <textBadge
            type="fill"
            style={`
              font-size: 20;
              border-radius: 30;
              margin: 0 10 12 0;
              padding: 1 5;
              tv-align: right;
              tv-position: bottom;
              tv-tint-color: rgb(255, 255, 255);
            `}
          >✓</textBadge>
        )}
      </overlay>
    </lockup>
  );
}
