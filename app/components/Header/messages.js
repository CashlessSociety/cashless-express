/*
 * HomePage Messages
 *
 * This contains all the text for the HomePage component.
 */
import { defineMessages } from 'react-intl';

export const scope = 'boilerplate.components.Header';

export default defineMessages({
  signup: {
    id: `${scope}.signup`,
    defaultMessage: 'Sign Up',
  },
  login: {
    id: `${scope}.login`,
    defaultMessage: 'Login',
  },
});
