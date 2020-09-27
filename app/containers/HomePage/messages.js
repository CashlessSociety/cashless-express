import { defineMessages } from 'react-intl';

export const scope = 'boilerplate.containers.HomePage';

export default defineMessages({
  joinButton: {
    id: `${scope}.joinButton`,
    defaultMessage: 'join',
  },
  loginButton: {
    id: `${scope}.loginButton`,
    defaultMessage: 'login',
  },
  metamaskButton: {
    id: `${scope}.metamaskButton`,
    defaultMessage: 'connect my wallet',
  },
  newWalletButton: {
    id: `${scope}.newWalletButton`,
    defaultMessage: 'give me a wallet',
  },
});