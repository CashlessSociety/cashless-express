import { defineMessages } from 'react-intl';

export const scope = 'boilerplate.containers.HomePage';

export default defineMessages({
  reservesHeader: {
    id: `${scope}.reservesHeader`,
    defaultMessage: 'Reserves',
  },
  publishButton: {
    id: `${scope}.publishButton`,
    defaultMessage: 'promise',
  },
  idInput: {
    id: `${scope}.idInput`,
    defaultMessage: 'ID',
  },
  amtInput: {
    id: `${scope}.amtInput`,
    defaultMessage: 'Amount (USD)',
  },
  incomingHeader: {
    id: `${scope}.incomingHeader`,
    defaultMessage: 'Incoming',
  },
  outgoingHeader: {
    id: `${scope}.outgoingHeader`,
    defaultMessage: 'Outgoing',
  },
  nameHeader: {
    id: `${scope}.nameHeader`,
    defaultMessage: 'Name',
  },
  idHeader: {
    id: `${scope}.idHeader`,
    defaultMessage: 'ID',
  },
  emailInput: {
    id: `${scope}.emailInput`,
    defaultMessage: 'Email',
  },
  unknown: {
    id: `${scope}.unknown`,
    defaultMessage: '(unknown)',
  },
});