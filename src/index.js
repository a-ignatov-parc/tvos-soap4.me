import ATV from 'atvjs/src/index';

ATV.Page.create({
	name: 'home',
	template(data) {
		return `<document>
			<alertTemplate>
				<title>${data.title}</title>
				<description>${data.description}</description>
			</alertTemplate>
		</document>`;
	},
	data: {
		title: 'Homepage',
		description: 'Test page.',
	},
});

ATV.start({
	onLaunch(options) {
		ATV.Navigation.navigate('home');
	}
});
