import { get as i18n } from '../localization';
import styles from '../common/styles';

export default function Authorize({ attrs = {}, events = {} }) {
  const { description } = attrs;
  const { onAuthorize } = events;

  return (
    <document>
      <head>
        {styles}
      </head>
      <alertTemplate>
        <title class="grey_text">
          {i18n('authorize-caption')}
        </title>
        <description class="grey_description">
          {description || i18n('authorize-description')}
        </description>
        <button onSelect={onAuthorize}>
          <text>
            {i18n('authorize-control-trigger')}
          </text>
        </button>
      </alertTemplate>
    </document>
  );
}
