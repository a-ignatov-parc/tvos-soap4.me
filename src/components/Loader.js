import PropTypes from 'prop-types';

export default function Loader(props) {
  const {
    heroImg,
    children,
  } = props;

  return (
    <document>
      <loadingTemplate>
        {heroImg && (
          <banner>
            <heroImg src={heroImg} />
          </banner>
        )}
        <activityIndicator>
          <title>{children}</title>
        </activityIndicator>
      </loadingTemplate>
    </document>
  );
}

Loader.propTypes = {
  heroImg: PropTypes.string,
  children: PropTypes.node,
};
