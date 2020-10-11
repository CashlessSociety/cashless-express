/*
 * WalletPage
 *
 * 
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import * as ethers from 'ethers';
import * as cashless from 'containers/App/cashless';
import { useKeyFileStickyState, useInterval } from 'utils/stateUtils';
import 'containers/App/app.css';

const providerURL = "https://"+cashless.network+".infura.io/v3/"+cashless.infuraAPIKey;

const toEth = (num) => {
    return num/ethers.utils.parseEther("1");
}

const fromEth = (num) => {
    return ethers.utils.parseEther(num.toString());
}

const toUSD = (num) => {
    return num/cashless.parseCoin("1");
}

const fromUSD = (num) => {
    return cashless.parseCoin(num);
}

export default function WalletPage(props) {
  const [loaded, setLoaded] = useState(false);
  const [key, setKey] = useKeyFileStickyState();
  const [myReserves, setMyReserves] = useState(0.0);
  const [myWalletEth, setMyWalletEth] = useState(0.0);
  const [myWalletUsdc, setMyWalletUsdc] = useState(0.0);
  const [usdcContract, setUsdcContract] = useState(null);
  const [contract, setContract] = useState(null);
  const [transactSwitch, setTransactSwitch] = useState(false);
  const [isTransacting, setIsTransacting] = useState(false);
  const [queryAmt, setQueryAmt] = useState("0.00");
  const [lastTxId, setLastTxId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const load = async () => {
    if (!loaded) {
        if (key != null) {
            let mySigner;
            if (key.private != null) {
                mySigner = cashless.wallet(providerURL, key.private);
            } else {
                await window.ethereum.enable();
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                mySigner = provider.getSigner();
            }
            let myUsdcContract = cashless.stablecoinContract(providerURL, mySigner);
            let myContract = cashless.contract(providerURL, mySigner);
            let balEthWei = await myUsdcContract.signer.getBalance();
            let balUsdcWei = await myUsdcContract.functions.balanceOf(key.address);
            let reserveWei = await myContract.functions.balanceOf(key.address);
            setUsdcContract(myUsdcContract);
            setContract(myContract);
            setMyWalletUsdc(toUSD(balUsdcWei));
            setMyWalletEth(toEth(balEthWei));
            setMyReserves(toUSD(reserveWei));
            setLoaded(true);
        } else {
            props.history.push({pathname: '/'});
        }
    }
  }

  const handleQueryAmt = evt => {
      setQueryAmt(evt.target.value);
  }

  const handleSwitch = _evt => {
      setTransactSwitch(!transactSwitch);
  }

  const handleTransact = async _evt => {
    let x = Number(queryAmt);
    let gp = await contract.signer.getGasPrice();
    setErrorMsg("sending...");
    if (x>0) {
        if (transactSwitch==true) {
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
            if (x>myWalletUsdc) {
                setErrorMsg('Not enough DAI in wallet');
                return
            }
            let txh = await cashless.fundReservesTx(contract, usdcContract, queryAmt);
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
    (async () => await load())();
  }, []);

  useInterval(async () => {
      if (loaded) {
        console.log("checking blockchain....");
        let balEthWei = await usdcContract.signer.getBalance();
        let balUsdcWei = await usdcContract.functions.balanceOf(await usdcContract.signer.getAddress());
        let reservesWei = await contract.functions.balanceOf(await contract.signer.getAddress());
        let balEth = toEth(balEthWei);
        let balUsdc = toUSD(balUsdcWei);
        let balRes = toUSD(reservesWei);
        if (myWalletUsdc != balUsdc) {
            setMyWalletUsdc(balUsdc);
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
            <h2>Your Wallet:</h2>
            <p className="center">{key.address}</p>
            <div className="outerDiv center wallet">
                <div className="borderedDiv center halfwidth">
                    <h1>Reserve (USDC): {myReserves.toFixed(2).toString()}</h1>
                </div>
                <div className="borderedDiv center halfwidth">
                    <h1>USDC: {myWalletUsdc.toFixed(2).toString()}</h1>
                    <h1>ETH: {myWalletEth.toFixed(5).toString()}</h1>
                </div>
                <p className="center marginRight">
                    <input type="text" className="textField" value={queryAmt} onChange={handleQueryAmt}/><button className="mini" onClick={handleTransact}>{!transactSwitch ? 'fund': 'withdraw'}</button>
                </p>
                <p className="center marginRight">{isTransacting ? <a className="oldLink" href={"https://"+cashless.network+".etherscan.io/tx/"+lastTxId}>view transaction</a>:<span>{errorMsg!="" ? <span>{errorMsg}</span>:<span>{!transactSwitch ? 'Fund Reserve with USDC':'Withdraw Reserve USDC'}</span>}</span>}</p>
                <p className="center marginRight"><button className="mini" onClick={handleSwitch}>{transactSwitch ? 'fund': 'withdraw'}</button></p>
            </div>
        </div>
        :
        <div className="outerDiv center">loading...</div>
        }
    </article>
  );
}
