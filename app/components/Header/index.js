import React from 'react';
import Img from 'components/Img';
import Banner from 'images/cashlessbanner.png';
import './header.css';
import { Link } from 'react-router-dom';

function Header() {

  return (
    <div>
        <div className="cen">
        <Link to="/profile"><button className="header">Feed</button></Link>
        <Link to="/wallet"><button className="header">Wallet</button></Link>
        <Link to="/explore"><button className="header">Explore</button></Link>
        </div>
        <div>
        <Img className="banner" src={Banner} alt="cashless.social"></Img>
        </div>
    </div>
  );
}

export default Header;
