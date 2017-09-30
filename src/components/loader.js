export default function Loader({ attrs = {} }) {
  const { title, heroImg } = attrs;

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
