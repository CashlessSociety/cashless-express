/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import * as ssbKeys from 'ssb-keys';
import * as cashless from 'containers/App/cashless';
import * as ethers from 'ethers';
import { useKeyFileStickyState, safeKey } from 'utils/stateUtils';
import 'containers/App/app.css';

export default function HomePage(props) {

  const [clickedJoin, setClickedJoin] = useState(false);
  const [key, setKey] = useKeyFileStickyState();
  const [loaded, setLoaded] = useState(false);

  const newKey = async (useMetamask) => {
    let key = ssbKeys.generate("ed25519", cashless.randomHash());
    let signer;
    let address;
    let priv;
    if (useMetamask) {
        console.log("using metamask!");
        await window.ethereum.enable();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        address = await signer.getAddress();
        console.log("check address:", address);
        priv = null;
    } else {
        let ethKey = cashless.bufferToHex(cashless.randomHash());
        address = cashless.addressFromPriv(ethKey);
        priv = ethKey;
        signer = cashless.wallet("https://"+process.env.CASHLESS_NETWORK+".infura.io/v3/"+process.env.INFURA_ID, ethKey);
    }
    if (signer == null || key == null || address == null) {
        console.log("error finding signer or key");
        return
    }
    return {feedKey: key, private: priv, address: address};
  }

  const hasFeed = async (feedId, address) => {
    const query = `query { feed(id:"`+feedId+`") {
        id
        reserves {
            address
        }
    }}`;
    try {
        let r = await axios.post(process.env.HTTP_PROTOCOL+process.env.HOST+":"+process.env.APOLLO_PORT, {query:query}, {});
        if (r.data.data.feed.id == feedId && r.data.data.feed.reserves.address == address) {
            return true;
        }
        return false;
    } catch(e) {
        console.log('could not find feed:', e.message);
        return false;
    }
  }

  const handleClickedJoin = _evt => {
      setClickedJoin(true);
  }

  const handleJoinMetamask = async _evt => {
    await handleJoin(true);
  }

  const handleJoinNewWallet = async _evt => {
    await handleJoin(false);
  }

  const handleJoin = async useMetamask => {
    let key = await newKey(useMetamask);
    let idmsg = {feed: {id: key.feedKey.id}, name: {type:"RESERVES", address: key.address}, type: "cashless/identity", header: {version: process.env.CASHLESS_VERSION, network: process.env.CASHLESS_NETWORK}, evidence:null};
    try {
        let r = await axios.post("/publish", {content: idmsg, key:safeKey(key)}, {});
        if (r.data.status=="ok") {
            console.log("published id msg!");
            let ok = await hasFeed(key.feedKey.id, key.address);
            if (ok) {
                console.log("has feed key!");
                handleDownload(key, useMetamask);
                console.log("downloaded key!");
                setKey(key);
                props.history.push({pathname:'/profile'});
            }
        }
    } catch(e) {
        console.log(e);
    }
  }

  const handleDownload = (key, useMetamask) => {
    let link = document.createElement('A');
    link.download ='key';
    let keyfile = JSON.parse(JSON.stringify(key.feedKey));
    if (useMetamask) {
        keyfile.eth = {private: null, address: key.address};
    } else {
        keyfile.eth = {private: key.private, address: key.address};
    }
    var data = new Blob([JSON.stringify(keyfile)], {type: 'application/json'});
    var url = window.URL.createObjectURL(data);
    link.href = url;
    link.click();
  }

  const handleLogin = _evt => {
    document.getElementById("file").click();
  }

  const handleKeyfileInput = async evt => {
    const fileLoaded = async e => {
      let keyfile = JSON.parse(e.target.result);
      let signer;
      let address;
      let priv;
      if (keyfile.eth.private == null) {
        await window.ethereum.enable();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        address = await signer.getAddress();
        priv = null;
      } else {
        address = cashless.addressFromPriv(keyfile.eth.private);
        signer = cashless.wallet("https://"+process.env.CASHLESS_NETWORK+".infura.io/v3/"+process.env.INFURA_ID, keyfile.eth.private);
        priv = keyfile.eth.private;
      }
      if (address != keyfile.eth.address) {
        console.log("login: address does not match");
        return
      }
      let ok = await hasFeed(keyfile.id, address);
      if (!ok) {
          console.log("login: failed to find feed");
          return
      }
      if (ok) {
        delete keyfile.eth;
        let key = {feedKey: keyfile, private: priv, address: address};
        setKey(key);
        props.history.push({pathname:'/profile'});
      }
    }
    const reader = new FileReader();
    reader.onload = fileLoaded;
    reader.readAsText(evt.target.files[0]);
  }

  const load = async () => {
    /*if (key!=null) {
        props.history.push({pathname:'/profile'});
    }*/
    setLoaded(true);
  }

  useEffect(() => {
    (async () => await load())();
  }, []);

  return (
    <article>
      <Helmet>
        <title>Home Page</title>
        <meta name="description" content="My homepage" />
      </Helmet>
        {loaded ?
        <div className="outerDiv">
            {!clickedJoin ? 
            <div className="center">
                <button onClick={handleClickedJoin}>
                    JOIN
                </button>
                <input type="file" id="file" className="hiddenFile" onChange={handleKeyfileInput}/>
                <button onClick={handleLogin}>
                    LOGIN
                </button>                
            </div>
            :
            <div className="center">
                <button className="extralong" onClick={handleJoinMetamask}>
                    connect my wallet
                </button>
                <button className="extralong" onClick={handleJoinNewWallet}>
                    give me a wallet
                </button>
            </div>
            }
        </div>
        :
        <div className="outerDiv center">loading...</div>
        }
    </article>
  );
}
