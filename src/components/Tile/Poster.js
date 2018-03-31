import PropTypes from 'prop-types';

export default function Poster(props) {
  const {
    src,
    useBinding,
    showTopShadow,
    showBottomShadow,
  } = props;

  return (
    <img
      binding='@src:{poster}'
      src={useBinding ? undefined : src}
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
  useBinding: PropTypes.bool,
  showTopShadow: PropTypes.bool,
  showBottomShadow: PropTypes.bool,
};

Poster.defaultProps = {
  useBinding: false,
  showTopShadow: false,
  showBottomShadow: false,
};
