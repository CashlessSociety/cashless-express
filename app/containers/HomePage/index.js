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
}

const getGrossAmount = (promises) => {
    let gross = 0
    for (let i=0; i<promises.length; i++) {
        gross += promises[i].amount
    }

    return gross
}

const network = "rinkeby";
const version = 1.0;
const emptyHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
const providerURL = "https://"+network+".infura.io/v3/fef5fecf13fb489387683541edfbd958";

export default function HomePage() {

  const [keyfile, setKeyfile] = useState(null);
  const [myFeed, setMyFeed] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [sendToEmail, setSendToEmail] = useState(false);
  const [queryId, setQueryId] = useState("@");
  const [queryEmail, setQueryEmail] = useState("@gmail.com");
  const [promiseAmount, setAmount] = useState("0.00");
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
    let idmsg = {feed: {id: key.id}, name: {type:"RESERVES", address: key.eth.address}, type: "cashless/identity", header: {version: version, network: network}, evidence:null};
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
                verifiedAccounts {
                    handle
                    accountType
                }
                assets {
                    amount
                    denomination
                    vestDate
                    nonce
                    recipient {
                        id
                        reserves {
                            address
                        }
                        commonName {
                            name
                        }
                    }
                }
                liabilities {
                    author {
                        id
                        reserves {
                            address
                        }
                        commonName {
                            name
                        }
                    }
                    amount
                    denomination
                    vestDate
                    nonce
                }
              }
            }`;
          
            let r = await axios.post('http://127.0.0.1:4000', {query:query}, {});
            if (r.data.data.feed != null && r.data.data.feed.reserves != null) {
                setKeyfile(key);
                setMyFeed(r.data.data.feed);
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

  const handleQueryEmail = async evt => {
      setQueryEmail(evt.target.value);
  }

  const handleCancel = _evt => {
    setQueryId(queryId.substring(0, queryId.length-1));
    setQueryEmail("@gmail.com");
    setQueryFeed(null);
  }

  const handleSendToEmail = _evt => {
      setSendToEmail(true);
  }

  const handleSendToId = _evt => {
      setSendToEmail(false);
  }

  const handlePublish = async _evt => {
    if (Number(promiseAmount)<=0) {
        setPublishResponse("promised amount cannot be zero");
        return
    }
    let promise = {type: "cashless/promise", header: {version: 1.0, network: network}};
    let claimName = bufferToHex(randomHash());
    let vestTime = now()+(60*86400);
    let voidTime = now()+(500*86400);
    promise.from = {id: keyfile.id, commonName: myFeed.commonName, reserves: {address: keyfile.eth.address}};
    if (!sendToEmail) {
        if (queryFeed==null) {
            setPublishResponse("must promise to an existing id");
        }
        if (queryFeed.id==keyfile.id) {
            setPublishResponse("cannot promise to yourself");
            return
        }
        let disputeDuration = 2*86400;
        let claimData = cashless.encodeClaim(promiseAmount, disputeDuration, vestTime, voidTime, keyfile.eth.address, queryFeed.reserves.address, claimName, emptyHash, 1);
        let contract = cashless.contract(providerURL, keyfile.eth.private);
        let libContract = cashless.libContract(providerURL);
        let claimSig = await cashless.signClaim(contract, libContract, claimData);
        promise.to = queryFeed;
        promise.promise = {nonce:1, claimName: claimName, denomination:"USD", amount: Number(promiseAmount), issueDate: new Date().toISOString(), vestDate: new Date(vestTime).toISOString(), fromSignature:{v: claimSig.v, r: bufferToHex(claimSig.r), s: bufferToHex(claimSig.s)}, claimData:bufferToHex(claimData)};
    } else {
        let substring = queryEmail.substring(queryEmail.length-10, queryEmail.length);
        if (substring != "@gmail.com") {
            setPublishResponse("cannot promise to: "+queryEmail);
            return
        }
        promise.to = {verifiedAccounts: [{handle: queryEmail, accountType:"GMAIL"}]};
        promise.promise = {nonce:0, claimName: claimName, denomination:"USD", amount: Number(promiseAmount), issueDate: new Date().toISOString(), vestDate: new Date(vestTime).toISOString()};
    }
    let res = await axios.post('http://127.0.0.1:3000/publish', {content: promise}, {});
    if (res.data.status=="ok") {
        if (!sendToEmail) {
            setPublishResponse("published!");
        } else {
            setPublishResponse("published promise to: "+queryEmail+" (must authenticate with email to claim)");
        }
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
            {myFeed.commonName==null ? <p><FormattedMessage {...messages.nameHeader} />: <FormattedMessage {...messages.unknown} /></p>:<p><FormattedMessage {...messages.nameHeader} />: {myFeed.commonName.name}</p>}
            <p>
                <FormattedMessage {...messages.idHeader} />: {keyfile.id}
            </p>
            <p>
                <FormattedMessage {...messages.incomingHeader} />: <span className="green">{getGrossAmount(myFeed.assets)}</span>
            </p>
            <p>
                <FormattedMessage {...messages.outgoingHeader} />: <span className="red">{getGrossAmount(myFeed.liabilities)}</span>
            </p>
            <p>
                <FormattedMessage {...messages.promiseHeader} />:
            </p>
            <p>
                {sendToEmail==false ?
                <span>
                    <FormattedMessage {...messages.idInput} />:&nbsp;&nbsp;&nbsp;
                    {queryFeed==null  ?
                        <span><input type="text" className="textField" value={queryId} onChange={handleQueryId}/> <a className="oldLink" onClick={handleSendToEmail}>or send to an email</a></span>
                        :
                        <span><span className="green">{queryFeed.commonName==null ? queryFeed.id.substring(0, 5)+"...   ("+queryFeed.reserves.address+")" : queryFeed.id.substring(0, 5)+"...   ("+queryFeed.commonName.name+")"}</span>&nbsp;&nbsp;<a className="oldLink" onClick={handleCancel}>change</a></span>
                    }
                </span>
                :
                <span>
                    <FormattedMessage {...messages.emailInput} />:&nbsp;&nbsp;&nbsp;
                    <input type="text" className="textField" value={queryEmail} onChange={handleQueryEmail}/> <a className="oldLink" onClick={handleSendToId}>or send to an id</a>
                </span>
                }   
            </p>
            <p>
                <FormattedMessage {...messages.amtInput} />:&nbsp;&nbsp;&nbsp;<input type="text" className="textField" value={promiseAmount} onChange={handleAmount}/>
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