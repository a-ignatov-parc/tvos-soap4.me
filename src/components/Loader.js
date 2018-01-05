import PropTypes from 'prop-types';

export default function Loader({ title, heroImg }) {
  return (
    <document>
      <loadingTemplate>
        {heroImg && (
          <banner>
            <heroImg src={heroImg} />
          </banner>
        )}
        <activityIndicator>
          <title>{title}</title>
        </activityIndicator>
      </loadingTemplate>
    </document>
  );
}

Loader.propTypes = {
  title: PropTypes.string,
  heroImg: PropTypes.string,
};
