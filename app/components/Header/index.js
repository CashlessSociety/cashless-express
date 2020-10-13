import React from 'react';
import Img from 'components/Img';
import Banner from 'images/icon-512x512.png';
import './header.css';
import { Link } from 'react-router-dom';

function Header() {

  return (
    <div>
        <div className="oDiv">
            <Img className="banner" src={Banner} alt="cashless.social"></Img>
            <Link to="/profile"><button className="header">Portfolio</button></Link>
            <Link to="/wallet"><button className="header">Wallet</button></Link>
            <Link to="/"><button className="header">Sign In</button></Link>
        </div>
    </div>
  );
}

export default Header;
