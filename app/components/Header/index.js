import React from 'react';
import { FormattedMessage } from 'react-intl';

//import A from './A';
import Img from './Img';
import NavBar from './NavBar';
//import HeaderLink from './HeaderLink';
import Banner from 'images/cashlessbanner.png';
//import messages from './messages';

function Header() {
  return (
    <div>
      <Img src={Banner} alt="cashless.social"></Img>
      <NavBar>
      </NavBar>
    </div>
  );
}

export default Header;
