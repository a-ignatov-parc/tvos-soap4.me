import withAccount from '../../hocs/withAccount';

function Main(props) {
  const status = props.accountIsLoading ? 'loading...' : 'loaded';

  return (
    <document>
      <alertTemplate>
        <title>Account info is {status}</title>
      </alertTemplate>
    </document>
  );
}

export default withAccount(Main);
