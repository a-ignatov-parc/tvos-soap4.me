import * as TVDML from 'tvdml';

export default class EventBus {
	constructor() {
		this.subscriptions = [];
	}

	subscription() {
		let {subscriptions} = this;

		let pipeline = TVDML.createStream({
			extend: {
				unsubscribe() {
					let index = subscriptions.indexOf(pipeline);

					if (~index) {
						subscriptions.splice(index, 1);
					}
				}
			}
		});

		subscriptions.push(pipeline);

		return pipeline;
	}

	broadcast(value) {
		this.subscriptions.forEach(pipeline => pipeline.sink(value));
	}
}
