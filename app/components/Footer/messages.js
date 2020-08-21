/*
 * Footer Messages
 *
 * This contains all the text for the Footer component.
 */
import { defineMessages } from 'react-intl';

export const scope = 'boilerplate.components.Footer';

export default defineMessages({
  welcome: {
    id: `${scope}.welcome`,
    defaultMessage: 'This project is licensed under the MIT license.',
  },
  authorTag: {
    id: `${scope}.authorTag`,
    defaultMessage: `
      Made with love by {author}.
    `,
  },
});
