import ATV from 'atvjs/src/index';

ATV.Page.create({
	name: 'home',
	template(data) {
		return `<document>
			<alertTemplate>
				<title>${data.title}</title>
				<description>${data.description}</description>
				<button>
					<text>${data.button}</text>
				</button>
				<button>
					<text>${data.button}</text>
				</button>
				<text>${data.text}</text>
			</alertTemplate>
		</document>`;
	},
	data: {
		title: 'Homepage',
		description: 'Test page.',
		button: 'Button',
		text: 'Some small text.',
	},
});

ATV.start({
	onLaunch(options) {
		ATV.Navigation.navigate('home');
	}
});
