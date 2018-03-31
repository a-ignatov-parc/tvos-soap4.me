import { PureComponent } from 'react';
import PropTypes from 'prop-types';

export default class Form extends PureComponent {
  static propTypes = {
    title: PropTypes.node,
    description: PropTypes.node,
    placeholder: PropTypes.node,
    buttonText: PropTypes.node,
    secure: PropTypes.bool,
    onSubmit: PropTypes.func,
    validate: PropTypes.func,
  };

  static defaultProps = {
    secure: false,
    buttonText: 'Ok',
    validate(value) {
      return !!value;
    },
  };

  state = {
    value: '',
    valid: this.props.validate(''), // Default value is always empty string.
  };

  onSubmit = () => {
    const { onSubmit } = this.props;
    if (onSubmit) onSubmit(this.state.value);
  }

  validate = value => {
    this.setState({
      value,
      valid: this.props.validate(value),
    });
  };

  componentDidMount() {
    const keyboard = this.textField.getFeature('Keyboard');
    keyboard.onTextChange = () => this.validate(keyboard.text);
  }

  render() {
    const {
      title,
      secure,
      buttonText,
      placeholder,
      description,
    } = this.props;

    const { valid } = this.state;

    return (
      <document>
        <formTemplate>
          <banner>
            <title>{title}</title>
            <description>{description}</description>
          </banner>
          <textField
            secure={secure}
            ref={node => (this.textField = node)}
          >
            {placeholder}
          </textField>
          <footer>
            <button
              disabled={!valid}
              onSelect={this.onSubmit}
            >
              <text>
                {buttonText}
              </text>
            </button>
          </footer>
        </formTemplate>
      </document>
    );
  }
}
