import PropTypes from 'prop-types';

export default function BadgeWatchedCount({ count }) {
  return (
    <textBadge
      type='fill'
      style={{
        fontSize: 20,
        borderRadius: 30,
        margin: '0 10 12 0',
        padding: '1 8',
        tvAlign: 'right',
        tvPosition: 'bottom',
        tvTintColor: 'rgb(255, 255, 255)',
      }}
      children={count}
    />
  );
}

BadgeWatchedCount.propTypes = {
  count: PropTypes.number,
};
