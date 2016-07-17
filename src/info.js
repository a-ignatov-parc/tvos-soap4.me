import {request} from './request';

const parser = new DOMParser();

export function getTVShowExtraInfo({sid}) {
	return request(`https://soap4.me/soap/${sid}/`).then(({responseText}) => {
		let infoRegex = /"right">(.+)<\/div>/g;
		let result = [];
		let match;

		while(match = infoRegex.exec(responseText)) {
			result.push(match[1]);
		}

		return result
			.map(content => parser.parseFromString(`<div>${content}</div>`, 'application/xml'))
			.reduce((result, document, i) => {
				let root = document.childNodes.item(0);

				switch(i) {
					case 0:
						result.status = root.textContent;
						break;
					case 1:
						result.year = root.textContent;
						break;
					case 2:
						result.duration = root.textContent;
						break;
					case 3:
						result.country = root.textContent;
						break;
					case 4:
						result.genres = Array
							.apply(null, Array(root.children.length))
							.map((item, i) => root.children.item(i))
							.map(node => node.textContent);
						break;
					case 5:
						result.actors = Array
							.apply(null, Array(root.children.length))
							.map((item, i) => root.children.item(i))
							.map(node => node.textContent);
						break;
				}

				return result;
			}, {});
	});
}

export function getSeasonsSpoilers({title}, season) {
	return request(`https://soap4.me/soap/${titleToSlug(title)}/${season}`).then(({responseText}) => {
		let infoRegex = /<p[^>]*>(.+)<\/p>/g;
		let result = [];
		let match;

		while(match = infoRegex.exec(responseText)) {
			result.push(match[1]);
		}

		return result.filter((item, i, arr) => arr.indexOf(item) === i);
	});
}

function titleToSlug(title) {
	return title.replace(' ', '_');
}
