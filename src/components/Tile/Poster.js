import PropTypes from 'prop-types';

export default function Poster(props) {
  const {
    src,
    binding,
    showTopShadow,
    showBottomShadow,
  } = props;

  return (
    <img
      binding='@src:{poster}'
      src={binding ? undefined : src}
      width='250'
      height='250'
      class='tile-img'
      style={{
        tvPlaceholder: 'tv',
        tvTintColor: `linear-gradient(
          top,
          rgba(0, 0, 0, ${showTopShadow ? '0.7' : '0'})
          0.2,
          transparent,
          0.8,
          transparent,
          rgba(0, 0, 0, ${showBottomShadow ? '0.7' : '0'})
        )`,
      }}
    />
  );
}

Poster.propTypes = {
  src: PropTypes.string,
  binding: PropTypes.bool,
  showTopShadow: PropTypes.bool,
  showBottomShadow: PropTypes.bool,
};

Poster.defaultProps = {
  binding: false,
  showTopShadow: false,
  showBottomShadow: false,
};
