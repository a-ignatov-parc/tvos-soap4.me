import { TYPE_EVENT } from './constants';

export function isEvent(action) {
  return action.type === TYPE_EVENT;
}

export function isEventWithName(name, action) {
  return isEvent(action) && action.meta.name === name;
}
