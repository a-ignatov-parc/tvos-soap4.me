import {request} from './request';

const parser = new DOMParser();

export function parseTVShowPage({sid}) {
	return request(`https://soap4.me/soap/${sid}/`).then(({responseText}) => {
		let infoRegex = /"right">(.+)<\/div>/g;
		let infoResult = [];
		let infoMatch;

		let recomendationsRegex = /covers\/soap\/(\d+)\..*title="([^"]+)"/g;
		let recomendationsResult = [];
		let recomendationsMatch;

		while(infoMatch = infoRegex.exec(responseText)) {
			infoResult.push(infoMatch[1]);
		}

		while(recomendationsMatch = recomendationsRegex.exec(responseText)) {
			recomendationsResult.push({
				sid: recomendationsMatch[1],
				title: recomendationsMatch[2],
			});
		}

		return infoResult
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
			}, {
				recomendations: recomendationsResult.filter(filterDuplicates(({sid}) => sid)),
			});
	});
}

export function parseTVShowSeasonPage({title}, season) {
	return request(`https://soap4.me/soap/${titleToSlug(title)}/${season}`).then(({responseText}) => {
		let infoRegex = /<p[^>]*>(.+)<\/p>/g;
		let result = [];
		let match;

		while(match = infoRegex.exec(responseText)) {
			result.push(match[1]);
		}

		return {
			spoilers: result.filter(filterDuplicates()),
		};
	});
}

function titleToSlug(title) {
	return title.replace(' ', '_');
}

function filterDuplicates(traverse = item => item) {
	let collection = {};
	return (...args) => {
		let key = traverse(...args);
		return !collection[key] && (collection[key] = true);
	};
}
