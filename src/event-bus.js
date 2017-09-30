import * as TVDML from 'tvdml';

export default class EventBus {
  constructor() {
    this.subscriptions = [];
  }

  subscription() {
    const { subscriptions } = this;

    const stream = TVDML.createStream({
      extend: {
        unsubscribe() {
          const index = subscriptions.indexOf(this);

          if (~index) {
            subscriptions.splice(index, 1);
          }
        },
      },
    });

    subscriptions.push(stream);

    return stream;
  }

  broadcast(value) {
    this.subscriptions.forEach(stream => stream.sink(value));
  }
}
