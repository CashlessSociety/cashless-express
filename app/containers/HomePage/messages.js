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
  downloadButton: {
    id: `${scope}.downloadButton`,
    defaultMessage: 'download',
  },
  publishButton: {
    id: `${scope}.publishButton`,
    defaultMessage: 'publish',
  },
  viewButton: {
    id: `${scope}.viewButton`,
    defaultMessage: 'query',
  },
  profileHeader: {
    id: `${scope}.profileHeader`,
    defaultMessage: 'profile:',
  },
  explorerHeader: {
    id: `${scope}.explorerHeader`,
    defaultMessage: 'get promises:',
  },
});