import React from 'react';
import { FormattedMessage } from 'react-intl';

//import A from './A';
//import Img from './Img';
import NavBar from './NavBar';
import HeaderLink from './HeaderLink';
//import Banner from './banner.jpg';
import messages from './messages';

function Header() {
  return (
    <div>
      <NavBar>
        <HeaderLink to="/signup">
          <FormattedMessage {...messages.signup} />
        </HeaderLink>
        <HeaderLink to="/login">
          <FormattedMessage {...messages.login} />
        </HeaderLink>
      </NavBar>
    </div>
  );
}

export default Header;
