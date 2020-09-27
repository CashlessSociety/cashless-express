/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import * as ethers from 'ethers';
import * as cashless from 'containers/App/cashless';
import { useInterval } from 'containers/AdminPage/interval';
import 'containers/App/app.css';

const providerURL = "https://"+cashless.network+".infura.io/v3/"+cashless.infuraAPIKey;

const toEth = (num) => {
    return num/ethers.utils.parseEther("1");
}

const fromEth = (num) => {
    return ethers.utils.parseEther(num.toString());
}

export default function WalletPage(props) {
  const [loaded, setLoaded] = useState(false);
  const [key, setKey] = useState(null);
  const [signer, setSigner] = useState(null);
  const [myReserves, setMyReserves] = useState(0.0);
  const [myWalletEth, setMyWalletEth] = useState(0.0);
  const [myWalletDai, setMyWalletDai] = useState(0.0);
  const [daiContract, setDaiContract] = useState(null);
  const [contract, setContract] = useState(null);
  const [transactSwitch, setTransactSwitch] = useState(null);
  const [isTransacting, setIsTransacting] = useState(false);
  const [isMetamask, setIsMetamask] = useState(false);
  const [queryAmt, setQueryAmt] = useState("0.00");
  const [lastTxId, setLastTxId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadKey = async () => {
    if (!loaded) {
        if (props.location.state!=null && props.location.state.key!=null) {
            setKey(props.location.state.key);
            let mySigner;
            if (props.location.state.key.private != null) {
                mySigner = cashless.wallet(providerURL, props.location.state.key.private);
            } else {
                await window.ethereum.enable();
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                mySigner = provider.getSigner();
                setIsMetamask(true);
                setTransactSwitch({fund: true});
            }
            setSigner(mySigner);
            let myDaiContract = cashless.stablecoinContract(providerURL, mySigner);
            let myContract = cashless.contract(providerURL, mySigner);
            let balEthWei = await myDaiContract.signer.getBalance();
            let balDaiWei = await myDaiContract.functions.balanceOf(props.location.state.key.address);
            let reserve = await myContract.functions.balanceOf(props.location.state.key.address);
            setDaiContract(myDaiContract);
            setContract(myContract);
            let balEth = toEth(balEthWei);
            let balDai = toEth(balDaiWei);
            setMyWalletDai(balDai);
            setMyWalletEth(balEth);
            setMyReserves(toEth(reserve));
            setLoaded(true);
        } else {
            props.history.push({pathname: '/'});
        }
    }
  }

  const handleQueryAmt = evt => {
      setQueryAmt(evt.target.value);
  }

  const handleChooseFund = _evt => {
      let ts = {fund: true, withdraw: false};
      setTransactSwitch(ts);
  }

  const handleChooseWithdraw= _evt => {
    let ts = {fund: false, withdraw: true};
    setTransactSwitch(ts);
  }

  const handleSwitch = _evt => {
      setTransactSwitch({fund: !transactSwitch.fund});
  }

  const handleChooseMetamask = async _evt => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    await signer.getAddress();
    let ts = JSON.parse(JSON.stringify(transactSwitch));
    ts.funder = "metamask";
    setTransactSwitch(ts);
  }

  const handleChooseCashless = _evt => {
    let ts = JSON.parse(JSON.stringify(transactSwitch));
    ts.funder = "cashless";
    setTransactSwitch(ts);
  }

  const handleTransact = async _evt => {
    let x = Number(queryAmt);
    let gp = await contract.signer.getGasPrice();
    setErrorMsg("sending...");
    if (x>0) {
        if (transactSwitch.fund==false) {
            console.log('attempting withdraw');
            if (60000*gp > fromEth(myWalletEth)) {
                setErrorMsg('Not enough ETH in wallet');
                return
            }
            if (x>myReserves) {
                setErrorMsg('Not enough DAI in reserves');
                return
            }
            let txh = await cashless.redeemReservesTx(contract, queryAmt, await contract.signer.getAddress());
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
            console.log(await contract.signer.getAddress());
            console.log(await daiContract.signer.getAddress());
            console.log(queryAmt);
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

  const handleTransactMetamask = async _evt => {
    await window.ethereum.enable();
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    let x = Number(queryAmt);
    let gp = await contract.signer.getGasPrice();
    setErrorMsg("sending...");
    if (x>0) {
        if (transactSwitch.withdraw) {
            console.log('attempting withdraw');
            if (60000*gp > fromEth(myWalletEth)) {
                setErrorMsg('Not enough ETH in wallet');
                return
            }
            if (x>myReserves) {
                setErrorMsg('Not enough USDC in reserves');
                return
            }
            let txh = await cashless.redeemReservesTx(contract, queryAmt, await contract.signer.getAddress());
            if (txh!=null) {
                setLastTxId(txh);
                setIsTransacting(true);
            } else {
                setErrorMsg('Withdraw Transaction Failed');
            }
        } else {
            console.log('attempting fund');
            let ethAmt = await signer.getBalance();
            if (120000*gp > ethAmt) {
                setErrorMsg('Not enough ETH in wallet');
                return
            }
            let daiAmt = await daiContract.functions.balanceOf(await signer.getAddress());
            if (x>toEth(daiAmt)) {
                setErrorMsg('Not enough USDC in wallet');
                return
            }
            console.log("got here!");
            let nContract = contract.connect(signer);
            let nDaiContract = daiContract.connect(signer);
            console.log(key.address);
            let txh = await cashless.fundReservesTx(nContract, nDaiContract, queryAmt, key.address);
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
        let balDaiWei = await daiContract.functions.balanceOf(await daiContract.signer.getAddress());
        let reserves = await contract.functions.balanceOf(await contract.signer.getAddress());
        let balEth = toEth(balEthWei);
        let balDai = toEth(balDaiWei);
        let balRes = toEth(reserves);
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
  }, 2000);

  return (
    <article>
      <Helmet>
        <title>Home Page</title>
        <meta name="description" content="My homepage" />
      </Helmet>
        {loaded ?
        <div>
            <h1>Your Wallet:</h1>
            <p className="center">{key.address}</p>
            {isMetamask ? 
            <div className="outerDiv center wallet">
                <div className="borderedDiv center halfwidth">
                    <h1>Reserve (USDC): {myReserves.toFixed(2).toString()}</h1>
                </div>
                <div className="borderedDiv center halfwidth">
                    <h1>USDC: {myWalletDai.toFixed(2).toString()}</h1>
                    <h1>ETH: {myWalletEth.toFixed(5).toString()}</h1>
                </div>
                <p className="center marginRight">
                    <input type="text" className="textField" value={queryAmt} onChange={handleQueryAmt}/><button className="mini" onClick={handleTransact}>{(transactSwitch.fund) ? 'fund': 'withdraw'}</button>
                </p>
                <p className="center marginRight">{isTransacting ? <a className="oldLink" href={"https://"+cashless.network+".etherscan.io/tx/"+lastTxId}>{lastTxId}</a>:<span>{errorMsg!="" ? <span>{errorMsg}</span>:<span>{transactSwitch.fund ? 'Fund Reserve with USDC':'Withdraw Reserve USDC'}</span>}</span>}</p>
                <p className="center marginRight"><button className="mini" onClick={handleSwitch}>{transactSwitch.fund ? 'withdraw': 'fund'}</button></p>
            </div>
            :
            <div className="outerDiv center wallet">
                <div className="borderedDiv center halfwidth">
                    <h1>Reserve (USDC): {myReserves.toFixed(2).toString()}</h1>
                </div>
                {transactSwitch == null ? <p className="center marginRight"><button className="shortWidth" onClick={handleChooseFund}>fund</button>&nbsp;<button className="shortWidth" onClick={handleChooseWithdraw}>withdraw</button></p>
                :
                <span>{(transactSwitch.fund && transactSwitch.funder == null) ? <p className="center marginRight">fund your reserve with USDC token<br></br><button className="mini" onClick={handleChooseMetamask}>connect metamask wallet</button>&nbsp;<button className="mini" onClick={handleChooseCashless}>use cashless wallet</button></p>
                    :
                    <span>
                        {(transactSwitch.fund && transactSwitch.funder=="metamask") ? <span></span>
                        :
                        <div className="borderedDiv center halfwidth">
                            <h1>USDC: {myWalletDai.toFixed(2).toString()}</h1>
                            <h1>ETH: {myWalletEth.toFixed(5).toString()}</h1>
                        </div>
                        }
                        <p className="center marginRight">
                            <input type="text" className="textField" value={queryAmt} onChange={handleQueryAmt}/><button className="mini" onClick={(transactSwitch.fund && transactSwitch.funder=="metamask") ? handleTransactMetamask : handleTransact}>{transactSwitch.fund ? 'fund': 'withdraw'}</button>
                        </p>
                        <p className="center marginRight">{isTransacting ? <a className="oldLink" href={"https://"+cashless.network+".etherscan.io/tx/"+lastTxId}>{lastTxId}</a>:<span>{errorMsg!="" ? <span>{errorMsg}</span>:<span>{transactSwitch.withdraw ? 'Withdraw Reserve to USDC':'Fund Reserve with USDC (from metamask)'}</span>}</span>}</p>
                    </span>
                    }
                </span>
                }
            </div>
            }
        </div>
        :
        <div className="outerDiv center">loading...</div>
        }
    </article>
  );
}