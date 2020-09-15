/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import * as ssbKeys from 'ssb-keys';
import * as crypto from 'crypto';
import * as cashless from 'containers/App/cashless';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
import './home.css';

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
  };

const network = "ropsten";
const emptyHash = "0x0000000000000000000000000000000000000000000000000000000000000000"
const providerURL = "https://"+network+".infura.io/v3/fef5fecf13fb489387683541edfbd958";

export default function HomePage() {

  const [keyfile, setKeyfile] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [queryId, setQueryId] = useState("@");
  const [promiseAmount, setAmount] = useState("0.00");
  const [myName, setMyName] = useState(null);
  const [queryFeed, setQueryFeed] = useState(null);
  const [publishResponse, setPublishResponse] = useState("");

  const newKey = () => {
    let key = ssbKeys.generate("ed25519", randomHash());
    let ethKey = bufferToHex(randomHash());
    let address = cashless.addressFromPriv(ethKey);
    key.eth = {private: ethKey, address: address};
    return key;
  }

  const handleJoin = async _evt => {
    let key = newKey();
    // !! never pass ethereum keys to the backend
    let noEthKey = JSON.parse(JSON.stringify(key));
    delete noEthKey.eth;
    let idmsg = {name: {type:"RESERVES", address: key.eth.address}, type: "cashless/identity", header: {version: 1.0, network: network}};
    try {
        let r = await axios.post('http://127.0.0.1:3000/publish', {content: idmsg, key: noEthKey}, {});
        if (r.data.status=="ok") {
            console.log("Thanks for joining!");
            setKeyfile(key);
        }
    } catch(e) {
        console.log(e);
    }
  }

  const handleLogin = _evt => {
    document.getElementById("file").click();
  }

  const handleKeyfileInput = async evt => {
    const fileLoaded = async e => {
      let key = JSON.parse(e.target.result);
      // !! never pass ethereum keys to the backend
      let noEthKey = JSON.parse(JSON.stringify(key));
      delete noEthKey.eth;
      let res = await axios.post('http://127.0.0.1:3000/login', {key: noEthKey}, {});
      if (res.data.status == "ok") {
        try {
            const query = `query { feed(id:"`+key.id+`") {
                reserves {
                    address
                }
                commonName {
                    name
                    id
                }
              }
            }`;
          
            let r = await axios.post('http://127.0.0.1:4000', {query:query}, {});
            if (r.data.data.feed != null && r.data.data.feed.reserves != null) {
                setKeyfile(key);
                setMyName(r.data.data.feed.commonName);
                setLoggedIn(true);
            }
        } catch (e) {
            console.log('could not find id:', e);
        }
      }
    }
    const reader = new FileReader();
    reader.onload = fileLoaded;
    reader.readAsText(evt.target.files[0]);
  }

  const handleDownload = _evt => {
    let link = document.createElement('A');
    link.download ='keyfile.json';
    var data = new Blob([JSON.stringify(keyfile)], {type: 'application/json'});
    var url = window.URL.createObjectURL(data);
    link.href = url;
    link.click();
  }

  const handleAmount = evt => {
      setAmount(evt.target.value);
  }

  const handleQueryId = async evt => {
      let q = evt.target.value;
      setQueryId(q);
      try {
        const query = `query { feed(id:"`+q+`") {
            id 
            commonName {
                name
                id
            }
            reserves {
                address
            }
          }
        }`;
      
        let r = await axios.post('http://127.0.0.1:4000', {query:query}, {});
        if (r.data.data.feed.reserves.address != null) {
            setQueryFeed(r.data.data.feed);
        }
      } catch(e) {
        console.log("failed to find id:", e);
      }
  }

  const handleCancel = _evt => {
    setQueryId(queryId.substring(0, queryId.length-1));
    setQueryFeed(null);
  }

  const handlePublish = async _evt => {
    if (Number(promiseAmount)<=0) {
        setPublishResponse("amount not set");
        return
    }
    if (queryFeed.id==keyfile.id) {
        setPublishResponse("cannot promise to yourself");
        return
    }
    let promise = {type: "cashless/promise", header: {version: 1.0, network: network}};
    // VERY IMPORTANT TO DO (wrong amount of ether)

    let claimName = bufferToHex(randomHash());
    let vestTime = now()+(60*86400);
    let voidTime = now()+(500*86400);
    let disputeDuration = 2*86400;
    let claimData = cashless.encodeClaim(promiseAmount, disputeDuration, vestTime, voidTime, keyfile.eth.address, queryFeed.reserves.address, claimName, emptyHash, emptyHash, 1);
    let contract = cashless.contract(providerURL, keyfile.eth.private);
    let libContract = cashless.libContract(providerURL);
    let claimSig = await cashless.signClaim(contract, libContract, claimData);
    promise.to = queryFeed;
    promise.from = {id: keyfile.id, commonName: myName, reserves: {address: keyfile.eth.address}};
    promise.promise = {denomination:"USD", amount: Number(promiseAmount), issueDate: new Date().toISOString(), vestDate: new Date(vestTime).toISOString(), fromSignature:{v: claimSig.v, r: bufferToHex(claimSig.r), s: bufferToHex(claimSig.s)}, claimData:bufferToHex(claimData)};
    let res = await axios.post('http://127.0.0.1:3000/publish', {content: promise}, {});
    if (res.data.status=="ok") {
        setPublishResponse("published!");
        setQueryId("@");
        setQueryFeed(null);
        setAmount("0.00");
    }
  }

  return (
    <article>
      <Helmet>
        <title>Home Page</title>
        <meta name="description" content="My homepage" />
      </Helmet>
      {loggedIn==false ?
        <div className="joinDiv">
            {keyfile==null ? 
            <div>
                <button className="raise up" onClick={handleJoin}>
                    <FormattedMessage {...messages.joinButton} />
                </button>
                <input type="file" id="file" className="hiddenFile" onChange={handleKeyfileInput}/>
                <button className="raise up" onClick={handleLogin}>
                    <FormattedMessage {...messages.loginButton} />
                </button>
            </div>
            :
            <div>
                <textarea className='keyArea' rows="15" cols="60" value={JSON.stringify(keyfile, null, 2)} readOnly>
                </textarea>
                <button className="raise up" id="download" onClick={handleDownload}>
                    <FormattedMessage {...messages.downloadButton} />
                </button>
            </div>
            }
        </div>
        :
        <div className="joinDiv">
            {myName==null ? <p></p>:<p>{myName.name}</p>}
            <p>
                ID: {keyfile.id}
            </p>
            <p>
                <FormattedMessage {...messages.profileHeader} />
            </p>
            <p> 
                <FormattedMessage {...messages.idInput} />&nbsp;&nbsp;&nbsp;
                {queryFeed==null  ?
                    <input type="text" className="textField" value={queryId} onChange={handleQueryId}/>
                    :
                    <span><span className="found">{queryFeed.commonName==null ? queryFeed.id.substring(0, 5)+"...       ("+queryFeed.reserves.address+")" : queryFeed.id.substring(0, 5)+"...       ("+queryFeed.commonName.name+")"}</span>&nbsp;&nbsp;<a className="oldLink" onClick={handleCancel}>change</a></span>
                }
            </p>
            <p>
                <FormattedMessage {...messages.amtInput} />&nbsp;&nbsp;&nbsp;<input type="text" className="textField" value={promiseAmount} onChange={handleAmount}/>
            </p>
            <button className="raise up" onClick={handlePublish}>
                <FormattedMessage {...messages.publishButton} />
            </button>
            {publishResponse=="" ? <p></p>: <p>{publishResponse}</p>}
        </div>
    }
    </article>
  );
}