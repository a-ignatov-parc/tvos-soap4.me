import {request} from './request';
import {parseHTML, nodesToArray} from './utils/parser';

export function parseTVShowPage({sid}) {
	return request(`https://soap4.me/soap/${sid}/`).then(({responseText}) => {
		let fixedHtml = responseText.replace(/<\/h5>/g, '</h4>');
		let fragment = parseHTML(fixedHtml);

		let infoNodes = nodesToArray(fragment.getElementsByTagName('div'))
			.filter(node => ~node.getAttribute('class').indexOf('info'))
			.map(node => node.getElementsByTagName('div'))
			.map(nodesToArray)
			.reduce((prev, next) => prev.concat(next))
			.filter(node => ~node.getAttribute('class').indexOf('right'));

		let recomendations = nodesToArray(fragment.getElementsByTagName('img'))
			.filter(node => ~node.getAttribute('src').indexOf('covers/soap'))
			.map(node => ({
				sid: node.getAttribute('src').match(/covers\/soap\/(\d+)/)[1],
				title: node.getAttribute('title'),
			}))
			.filter(filterDuplicates(({sid}) => sid));

		return infoNodes.reduce((result, fragment, i) => {
			switch(i) {
				case 0:
					result.status = fragment.textContent;
					break;
				case 3:
					result.year = fragment.textContent;
					break;
				case 4:
					result.duration = fragment.textContent;
					break;
				case 5:
					result.country = fragment.textContent;
					break;
				case 6:
					result.genres = Array
						.apply(null, Array(fragment.children.length))
						.map((item, i) => fragment.children.item(i))
						.map(node => node.textContent);
					break;
				case 7:
					result.actors = Array
						.apply(null, Array(fragment.children.length))
						.map((item, i) => fragment.children.item(i))
						.map(node => node.textContent);
					break;
			}
			return result;
		}, {recomendations});
	});
}

export function parseTVShowSeasonPage({title}, season) {
	return request(`https://soap4.me/soap/${titleToSlug(title)}/${season}`).then(({responseText}) => {
		let fragment = parseHTML(responseText);
		let result = fragment.getElementsByTagName('p');
		let spoilers = nodesToArray(result)
			.map(node => node.textContent)
			.filter(filterDuplicates());

		return {spoilers};
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
