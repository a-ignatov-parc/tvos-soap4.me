import {get, toString} from './request';
import {parseHTML, nodesToArray} from './utils/parser';

export function parseTVShowPage({sid}) {
	return get(`https://soap4.me/soap/${sid}/`)
		.then(toString())
		.then(response => {
			let fixedHtml = response.replace(/<\/h5>/g, '</h4>');
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

			let count = nodesToArray(fragment.getElementsByTagName('div'))
				.filter(node => ~node.getAttribute('class').indexOf('info'))
				.map(node => node.getElementsByTagName('span'))
				.map(nodesToArray)
				.reduce((prev, next) => prev.concat(next))
				.filter(node => ~node.getAttribute('class').indexOf('count'))
				.reduce(node => node)
				.textContent;

			let reviews = nodesToArray(fragment.getElementsByTagName('div'))
				.filter(node => ~node.getAttribute('class').indexOf('reviews'))
				.map(node => node.getElementsByTagName('li'))
				.map(nodesToArray)
				.reduce((prev, next) => prev.concat(next))
				.map(node => {
					let result = {
						user: '',
						text: '',
					};

					for (var i = 0, length = node.childNodes.length; i < length; i++) {
						let child = node.childNodes.item(i);

						if (child.nodeName === '#text') {
							result.text += trim(child.textContent);
						} else if (child.nodeName.toLowerCase() === 'br') {
							result.text += '\n';
						} else if (~child.getAttribute('class').indexOf('header')) {
							let [user, date] = child.textContent.split(/\s*–\s*/);
							result.user = trim(user);
							result.date = trim(date);
						}
					}

					return result;
				});

			return infoNodes.reduce((result, fragment, i) => {
				switch(i) {
					case 0:
						result.status = fragment.textContent;
						break;
					case 3:
						result.year = fragment.textContent;
						break;
					case 4:
						let [
							match,
							hours,
							minutes,
							runtime,
						] = fragment.textContent.match(/(\d+)[^\d]+(\d+)[^\d]+(\d+)/);
						result.runtime = `${prettifyNumber(runtime)}min`;
						result.duration = [
							(+hours ? `${hours}hr` : null),
							(+minutes ? `${prettifyNumber(minutes)}min` : null),
						].filter(Boolean).join(' ');
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
			}, {recomendations, count, reviews});
		});
}

export function parseTVShowSeasonPage({title}, season) {
	return get(`https://soap4.me/soap/${titleToSlug(title)}/${season}/`)
		.then(toString())
		.then(response => {
			let fragment = parseHTML(response);
			let result = fragment.getElementsByTagName('p');
			let spoilers = nodesToArray(result)
				.map(node => node.textContent)
				.filter(filterDuplicates());

			return {spoilers};
		});
}

export function parseActorPage(actorName) {
	return get(`https://soap4.me/actors/${titleToSlug(actorName)}/`)
		.then(toString())
		.then(response => {
			let fragment = parseHTML(response);
			let tvshows = nodesToArray(fragment.getElementsByTagName('img'))
				.filter(node => ~node.getAttribute('src').indexOf('covers/soap'))
				.map(node => ({
					sid: node.getAttribute('src').match(/covers\/soap\/(\d+)/)[1],
					title: node.getAttribute('title'),
				}))
				.filter(filterDuplicates(({sid}) => sid));

			return {tvshows};
		});
}

function titleToSlug(title) {
	return title.replace(/\s/g, '_');
}

function filterDuplicates(traverse = item => item) {
	let collection = {};
	return (...args) => {
		let key = traverse(...args);
		return !collection[key] && (collection[key] = true);
	};
}

function prettifyNumber(number = '') {
	return `00${number}`.slice(-2);
}

function trim(string = '') {
	return `${string}`.replace(/^[\s\t↵]+|[\s\t↵]+$/g, '');
}
