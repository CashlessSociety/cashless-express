import React from 'react';
import Img from 'components/Img';
import Banner from 'images/cashlessbanner.png';
import './header.css';

function Header() {

  return (
    <div>
      <Img className="banner" src={Banner} alt="cashless.social"></Img>
    </div>
  );
}

export default Header;
