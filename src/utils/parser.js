import entities from './parser/entities.json';

const document = DOMImplementationRegistry
	.getDOMImplementation()
	.createDocument();

const entitiesRegexp = /&(\w+);/g;

export function parseHTML(htmlString = '') {
	let fragment = document.createElement('fragment');
	let preparedHtmlString = htmlString
		.replace('<!DOCTYPE html>', '')
		.replace(/data:/g, 'data-');
	let processedHtmlString = processEntitiesInString(preparedHtmlString);
	let postProcessedHtmlString = processedHtmlString.replace(/&/g, '&amp;');

	fragment.innerHTML = postProcessedHtmlString;
	return fragment;
}

export function nodesToArray(IKDOMNodeList) {
	let result = [];

	for (let i = 0, length = IKDOMNodeList.length; i < length; i++) {
		result.push(IKDOMNodeList.item(i));
	}

	return result;
}

function processEntitiesInString(string) {
	return string.replace(entitiesRegexp, (match, key) => {
		if (entities[key] != null) {
			return entities[key];
		}
		return match;
	});
}
