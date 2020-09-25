/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import * as crypto from 'crypto';
import * as ethers from 'ethers';
import * as cashless from 'containers/App/cashless';
import { useInterval } from 'containers/AdminPage/interval';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
import './wallet.css';

const bufferToHex = (buffer) => {
  let result = [...new Uint8Array (buffer)]
      .map (b => b.toString (16).padStart (2, "0"))
      .join ("");
  return "0x"+result
}

const randomHash = () => {
  let bytes = crypto.randomBytes(256);
  let hash = crypto.createHash('sha256');
  hash.update(bytes);
  return hash.digest();
}

const now = () => {
    return Math.floor(Date.now() / 1000);
}

const network = "rinkeby";
const providerURL = "https://"+network+".infura.io/v3/fef5fecf13fb489387683541edfbd958";

const toEth = (num) => {
    return num/ethers.utils.parseEther("1");
}

export default function WalletPage(props) {

  const [loaded, setLoaded] = useState(false);
  const [keyfile, setKeyfile] = useState(null);
  const [myReserves, setMyReserves] = useState(0.0);
  const [myWalletEth, setMyWalletEth] = useState(0.0);
  const [myWalletDai, setMyWalletDai] = useState(0.0);
  const [daiContract, setDaiContract] = useState(null);
  const [contract, setContract] = useState(null);
  const [isTransacting, setIsTransacting] = useState(false);

  const loadKey = async () => {
    if (!loaded) {
        if (props.location.state!=null && props.location.state.key!=null) {
            console.log("got here!");
            setKeyfile(props.location.state.key);
            console.log(props.location.state.key.eth);
            let myDaiContract = cashless.erc20Contract(providerURL, props.location.state.key.eth.private);
            let myContract = cashless.contract(providerURL, props.location.state.key.eth.private);
            console.log(myDaiContract);
            let balEthWei = await myDaiContract.signer.getBalance();
            let balDaiWei = await myDaiContract.functions.balanceOf(props.location.state.key.eth.address);
            let reserves = await myContract.functions.reserves(myContract.signer.getAddress());
            setDaiContract(myDaiContract);
            setContract(myContract);
            let balEth = toEth(balEthWei);
            let balDai = toEth(balDaiWei);
            setMyWalletDai(balDai);
            setMyWalletEth(balEth);
            setMyReserves(toEth(reserves["balance"]));
            setLoaded(true);
        } else {
            props.history.push({pathname: '/'});
        }
    }
  }

  useEffect(() => {
    (async () => await loadKey())();
  }, []);

  /*useInterval(async () => {
      if (loaded) {
        let balEthWei = await daiContract.signer.getBalance();
        let balDaiWei = await daiContract.functions.balanceOf(daiContract.signer.getAddress());
        let reserves = await cashless.getReserves(contract, contract.signer.getAddress());
        let balEth = toEth(balEthWei);
        let balDai = toEth(balDaiWei);
        let balRes = toEth(reserves["balance"]);
        if (myWalletDai != balDai) {
            setMyWalletDai(balDai);
        }
        if (myWalletEth != balEth) {
            setMyWalletEth(balEth);
        }
        if (myReserves != balRes) {
            setMyReserves(balRes);
        }
      }
  }, 5000);*/

  return (
    <article>
      <Helmet>
        <title>Home Page</title>
        <meta name="description" content="My homepage" />
      </Helmet>
        {loaded ?
        <div className="outerDiv row">
            <div className="borderedDiv halfwidth">
                <h1>Reserves</h1>
                <h1>USD: {myReserves.toFixed(2).toString()}</h1>
            </div>
            <div className="borderedDiv halfwidth">
                <h1>Wallet</h1>
                <h1>Eth: {myWalletEth.toFixed(5).toString()}</h1>
                <h1>USD: {myWalletDai.toFixed(2).toString()}</h1>
            </div>
        </div>
        :
        <div className="outerDiv center">loading...</div>
        }
    </article>
  );
}