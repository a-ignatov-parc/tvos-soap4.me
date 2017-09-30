export default function Loader({attrs = {}}) {
	let {title, heroImg} = attrs;
	let banner;

	if (heroImg) {
		banner = (
			<banner>
				<heroImg src={heroImg} />
			</banner>
		);
	}

	return (
		<document>
			<loadingTemplate>
				{banner}
				<activityIndicator>
					<title>{title}</title>
				</activityIndicator>
			</loadingTemplate>
		</document>
	);
}
