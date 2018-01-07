import PropTypes from 'prop-types';

export default function Overlay({ children }) {
  return (
    <overlay
      style={{
        margin: 0,
        padding: 0,
      }}
    >
      {children}
    </overlay>
  );
}

Overlay.propTypes = {
  children: PropTypes.node,
};
