import React from 'react';
import { FormattedMessage } from 'react-intl';

import A from 'components/A';
import LocaleToggle from 'containers/LocaleToggle';
import './footer.css';
import messages from './messages';

function Footer() {
  return (
    <div className='footerWrapper'>
        <div className='footerItem'>
        <FormattedMessage {...messages.authorTag} values={{
            author: <A href="https://github.com/factn" target="_blank">factn</A>,
          }}/>
        </div>
        <div className='footerItem'>
            <LocaleToggle />  
        </div>
    </div>
  );
}

export default Footer;
