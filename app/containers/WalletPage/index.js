/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import * as crypto from 'crypto';
import * as ethers from 'ethers';
import * as cashless from 'containers/App/cashless';
import { useInterval } from 'containers/AdminPage/interval';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
import LeftArrow from 'images/leftarrow.png';
import RightArrow from 'images/rightarrow.png';
import Img from 'components/Img';
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

const fromEth = (num) => {
    return ethers.utils.parseEther(num.toString());
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
  const [switchWithdraw, setSwitchWithdraw] = useState(false);
  const [queryAmt, setQueryAmt] = useState("0.00");
  const [lastTxId, setLastTxId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

  const handleSwitch = _evt => {
      setSwitchWithdraw(!switchWithdraw);
      setErrorMsg("");
  }

  const handleQueryAmt = evt => {
      setQueryAmt(evt.target.value);
  }

  const handleTransact = async _evt => {
    let x = Number(queryAmt);
    let gp = await contract.signer.getGasPrice();
    console.log("gas price:", gp);
    if (x>0) {
        if (switchWithdraw) {
            console.log('attempting withdraw');
            if (60000*gp > fromEth(myWalletEth)) {
                setErrorMsg('Not enough ETH in wallet');
                return
            }
            if (x>myReserves) {
                setErrorMsg('Not enough DAI in reserves');
                return
            }
            let txh = await cashless.withdrawReservesTx(contract, queryAmt, contract.signer.getAddress());
            if (txh!=null) {
                setLastTxId(txh);
                setIsTransacting(true);
            } else {
                setErrorMsg('Withdraw Transaction Failed');
            }
        } else {
            console.log('attempting fund');
            if (120000*gp > fromEth(myWalletEth)) {
                setErrorMsg('Not enough ETH in wallet');
                return
            }
            if (x>myWalletDai) {
                setErrorMsg('Not enough DAI in wallet');
                return
            }
            let txh = await cashless.fundReservesTx(contract, daiContract, queryAmt);
            if (txh!=null) {
                setLastTxId(txh);
                setIsTransacting(true);
            } else {
                setErrorMsg('Fund Transaction Failed');
            }
        }
    } else {
        setErrorMsg('must be a number greater than 0');
    }
  }

  useEffect(() => {
    (async () => await loadKey())();
  }, []);

  useInterval(async () => {
      if (loaded) {
        console.log("checking blockchain....");
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
  }, 5000);

  return (
    <article>
      <Helmet>
        <title>Home Page</title>
        <meta name="description" content="My homepage" />
      </Helmet>
        {loaded ?
        <div>
            <h1>Your Wallet Address: <br></br>{keyfile.eth.address}</h1>
            <div className="outerDiv row">
                <div className="aboveBorder halfwidth">
                    <h1>Reserves</h1>
                    <div className="borderedDiv halfwidth">
                        <h1>USD: {myReserves.toFixed(2).toString()}</h1>
                    </div>
                </div>
                <div className="noBorder center" onClick={handleSwitch}>
                    {switchWithdraw ? <Img className="arrow" src={RightArrow}></Img>:<Img className="arrow" src={LeftArrow}></Img>}
                </div>
                <div className="aboveBorder halfwidth">
                    <h1>Wallet</h1>
                    <div className="borderedDiv halfwidth">
                        {myWalletEth==0 ? <p> send ETH to wallet address!</p>:<h1>Eth: {myWalletEth.toFixed(5).toString()}</h1>}
                        {myWalletDai==0 ? <p> send DAI to wallet address!</p>:<h1>USD: {myWalletDai.toFixed(2).toString()}</h1>}
                    </div>
                </div>
            </div>
            <div>
                <p>
                    <input type="text" className="textField" value={queryAmt} onChange={handleQueryAmt}/> <button className="mini" onClick={handleTransact}>{switchWithdraw ? 'withdraw':'fund'}</button>
                </p>
                <h1>{isTransacting ? <a className="oldLink" href={"https://"+network+".etherscan.io/tx/"+lastTxId}>{lastTxId}</a>:<span>{errorMsg!="" ? <span>{errorMsg}</span>:<span>{switchWithdraw ? 'Withdraw Your Reserves':'Fund Your Reserves'}</span>}</span>}</h1>
            </div>
        </div>
        :
        <div className="outerDiv center">loading...</div>
        }
    </article>
  );
}