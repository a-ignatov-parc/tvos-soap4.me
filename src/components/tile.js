import { link } from '../utils';

export default function Tile({ key, attrs = {}, events = {} }) {
  const {
    route,
    title,
    poster,
    counter,
    subtitle,
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
            0.4,
            transparent,
            rgba(0, 0, 0, 0.5)
          );
        `}
      />
      <title
        class="tile-title"
        style="tv-text-highlight-style: marquee-on-highlight"
      >{title}</title>
      <subtitle class="tile-subtitle">{subtitle}</subtitle>
      <overlay style="margin: 0; padding: 0;">
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
          <badge
            style="tv-position: bottom-right;"
            src="resource://overlay-checkmark"
          />
        )}
      </overlay>
    </lockup>
  );
}
