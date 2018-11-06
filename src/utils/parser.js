import entities from './parser/entities.json';

const entitiesRegexp = /&(\w+);/g;

// eslint-disable-next-line import/prefer-default-export
export function processEntitiesInString(string) {
  return string
    .replace(/&#039;/g, "'")
    .replace(entitiesRegexp, (match, key) => {
      if (entities[key] != null) {
        return entities[key];
      }
      return match;
    });
}
