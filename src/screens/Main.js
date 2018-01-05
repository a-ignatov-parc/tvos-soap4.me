import withAccount from '../hocs/withAccount';

import Loader from '../components/Loader';

function Main(props) {
  const {
    account,
    accountIsLoading,
  } = props;

  if (accountIsLoading) {
    return (
      <Loader title='Checking authorization...' />
    );
  }

  const status = account.logged ? 'authorized' : 'not authorized';

  return (
    <document>
      <alertTemplate>
        <title>User is {status}</title>
      </alertTemplate>
    </document>
  );
}

export function Menu() {

}

export function MenuItem() {

}

export default withAccount(Main);
