/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import * as ethers from 'ethers';
import * as cashless from 'containers/App/cashless';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
import 'containers/App/app.css';

const uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

const now = () => {
    return Math.floor(Date.now() / 1000);
}

const getGrossAmount = (promises) => {
    let gross = 0
    for (let i=0; i<promises.length; i++) {
        gross += promises[i].amount
    }

    return gross;
}

const emptyHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
const providerURL = "https://"+cashless.network+".infura.io/v3/"+cashless.infuraAPIKey;

const getReservesAmount = async (address) => {
	let contract = cashless.contract(providerURL, null);
    let resp = await contract.functions.balanceOf(address);
    return resp/ethers.utils.parseEther("1");
}

export default function ProfilePage(props) {

  const [loaded, setLoaded] = useState(false);
  const [key, setKey] = useState(null);
  const [myFeed, setMyFeed] = useState(null);
  const [myReserves, setMyReserves] = useState(0.0);

  const [queryId, setQueryId] = useState("@");
  const [queryEmail, setQueryEmail] = useState("@gmail.com");
  const [promiseAmount, setAmount] = useState("0.00");
  const [queryFeed, setQueryFeed] = useState(null);
  const [publishResponse, setPublishResponse] = useState("publish a promise!");

  const [sendToEmail, setSendToEmail] = useState(false);
  const [changeName, setChangeName] = useState(false);
  const [newName, setNewName] = useState("");

  const getMyFeed = async (feedId) => {
    const query = `query { feed(id:"`+feedId+`") {
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
            author {
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
            recipient {
                id
                reserves {
                    address
                }
                commonName {
                    name
                }
                verifiedAccounts {
                    accountType
                    handle
                }
            }
            amount
            denomination
            vestDate
            nonce
        }
    }}`;
    try {
        let r = await axios.post('http://127.0.0.1:4000', {query:query}, {});
        if (r.data.data.feed != null && r.data.data.feed.reserves != null) {
            setMyFeed(r.data.data.feed);
            setMyReserves(await getReservesAmount(r.data.data.feed.reserves.address));
            if (r.data.data.feed.commonName != null) {
                setNewName(r.data.data.feed.commonName.name);
            }
            return true;
        } else {
            console.log('failed to find feed...',);
            console.log(r.data.data.feed);
        }
        return false;
    } catch(e) {
        console.log('could not find feed:', e.message);
        return false;
    }
  }

  const loadKey = async () => {
    if (!loaded) {
        if (props.location.state!=null && props.location.state.key!=null) {
            setKey(props.location.state.key);
            let ok = await getMyFeed(props.location.state.key.feedKey.id);
            if (ok) {
                setLoaded(true);
            } else {
                props.history.push({pathname: '/'});
            }
        } else {
            props.history.push({pathname: '/'});
        }
    }
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

  const handleGoWallet = _evt => {
    props.history.push({pathname:'/wallet', state: {key: key}});
  }

  const handleCancel = _evt => {
    setQueryId(queryId.substring(0, queryId.length-1));
    setQueryEmail("@gmail.com");
    setQueryFeed(null);
  }

  const handleNewName = evt => {
      setNewName(evt.target.value);
  }

  const handleChangeName = _evt => {
      setChangeName(true);
  }

  const handleSubmitName = async evt => {
    let idmsg = {feed: {id: key.feedKey.id}, name: {type:"COMMON", name: newName, id:uuid()}, type: "cashless/identity", header: {version: cashless.version, network: cashless.network}, evidence:null};
    try {
        let r = await axios.post('http://127.0.0.1:3000/publish', {content: idmsg}, {});
        if (r.data.status=="ok") {
            console.log('reset name!');
            setChangeName(false);
            await getMyFeed(key.feedKey.id);
        }
    } catch(e) {
        console.log('error changing name:', e.message);
    }
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
    let promise = {type: "cashless/promise", header: {version: cashless.version, network: cashless.network}};
    let claimName = cashless.bufferToHex(cashless.randomHash());
    // !!!
    // NOTE: backdating promises by 60 days so settlements can happen immediately
    // !!!
    let issueTime = now()-(61*86400);
    let vestTime = issueTime+(60*86400);
    let voidTime = issueTime+(500*86400);
    promise.from = {id: key.feedKey.id, commonName: myFeed.commonName, reserves: {address: key.address}};
    if (!sendToEmail) {
        if (queryFeed==null) {
            setPublishResponse("must promise to an existing id");
        }
        if (queryFeed.id==key.feedKey.id) {
            setPublishResponse("cannot promise to yourself");
            return
        }
        // !!!
        // NOTE: dispute period at 0 so settlements can happen immediately
        // !!!
        let disputeDuration = 0;
        let claimData = cashless.encodeClaim(promiseAmount, disputeDuration, vestTime, voidTime, key.address, queryFeed.reserves.address, claimName, emptyHash, 1);
        let contract = cashless.contract(providerURL, key.signer);
        let libContract = cashless.libContract(providerURL);
        let claimSig = await cashless.signClaim(contract, libContract, claimData);
        promise.to = queryFeed;
        promise.promise = {nonce:1, claimName: claimName, denomination:"USD", amount: Number(promiseAmount), issueDate: issueTime, vestDate: vestTime, fromSignature:{v: claimSig.v, r: cashless.bufferToHex(claimSig.r), s: cashless.bufferToHex(claimSig.s)}, claimData:cashless.bufferToHex(claimData)};
    } else {
        if (queryEmail.length>10 && queryEmail.substring(queryEmail.length-10, queryEmail.length) != "@gmail.com") {
            setPublishResponse("cannot promise to: "+queryEmail+ "(gmail only)");
            return
        }
        promise.to = {verifiedAccounts: [{handle: queryEmail, accountType:"GMAIL"}]};
        promise.promise = {nonce:0, claimName: claimName, denomination:"USD", amount: Number(promiseAmount), issueDate: issueTime, vestDate: vestTime};
    }
    let res = await axios.post('http://127.0.0.1:3000/publish', {content: promise}, {});
    if (res.data.status=="ok") {
        if (!sendToEmail) {
            setPublishResponse("published promise!");
        } else {
            setPublishResponse("published promise (to: '"+queryEmail+"')");
        }
        setQueryId("@");
        setQueryFeed(null);
        setAmount("0.00");
        setQueryEmail("@gmail.com");
        await getMyFeed(key.feedKey.id);
    }
  }

  useEffect(() => {
    (async () => await loadKey())();
  }, []);

  return (
    <article>
      <Helmet>
        <title>Home Page</title>
        <meta name="description" content="My homepage" />
      </Helmet>
        {loaded ?
        <div className="outerDiv column">
            <div>
                {changeName==false ?
                <p><span className="bold under"><FormattedMessage {...messages.nameHeader} /></span>:&nbsp;
                    {myFeed.commonName==null ? <span><FormattedMessage {...messages.unknown} /></span>:<span>{myFeed.commonName.name}</span>}
                    &nbsp;<button className="mini" onClick={handleChangeName}>change</button>
                </p>
                :
                <p>
                    <span className="bold under"><FormattedMessage {...messages.nameHeader} /></span>:&nbsp;&nbsp;<input type="text" className="textField" value={newName} onChange={handleNewName}/>
                    &nbsp;<button className="mini" onClick={handleSubmitName}>submit</button>
                </p>
                }
                <p>
                    <span className="bold under"><FormattedMessage {...messages.idHeader} /></span>: {key.feedKey.id}
                </p>
                <p>
                    <span className="bold under"><FormattedMessage {...messages.reservesHeader} /></span>: {'$'+myReserves.toFixed(2).toString()} <span>&nbsp;<button className="mini" onClick={handleGoWallet}>go to Wallet</button></span>
                </p>
                <p>
                    <span className="bold under"><FormattedMessage {...messages.incomingHeader} /></span>: <span className="green">{'$'+getGrossAmount(myFeed.assets).toFixed(2).toString()}&nbsp;&nbsp; <Link className="oldLink" to="/myAssets" promises={myFeed.assets} key={key}>see all</Link></span>
                </p>
                <p>
                    <span className="bold under"><FormattedMessage {...messages.outgoingHeader} /></span>: <span className="red">{'$'+getGrossAmount(myFeed.liabilities).toFixed(2).toString()}&nbsp;&nbsp; <Link className="oldLink" to="/myLiabilities" promises={myFeed.liabilities} key={key}>see all</Link></span>
                </p>
            </div>
            <div className="borderedDiv">
                <p>
                    {sendToEmail==false ?
                    <span>
                        <span className="bold under"><FormattedMessage {...messages.idInput} /></span>:&nbsp;
                        {queryFeed==null  ?
                            <span><input type="text" className="textField" value={queryId} onChange={handleQueryId}/> <button className="mini" onClick={handleSendToEmail}>send to email</button></span>
                            :
                            <span><span className="green">{queryFeed.commonName==null ? queryFeed.id.substring(0, 5)+"...   ("+queryFeed.reserves.address+")" : queryFeed.id.substring(0, 5)+"...   ("+queryFeed.commonName.name+")"}</span>&nbsp;&nbsp;<button className="mini" onClick={handleCancel}>change</button></span>
                        }
                    </span>
                    :
                    <span>
                        <span className="bold under"><FormattedMessage {...messages.emailInput} /></span>:&nbsp;
                        <input type="text" className="textField" value={queryEmail} onChange={handleQueryEmail}/> <button className="mini" onClick={handleSendToId}>send to id</button>
                    </span>
                    }   
                </p>
                <p>
                    <span className="bold under"><FormattedMessage {...messages.amtInput} /></span>:&nbsp;<input type="text" className="textField" value={promiseAmount} onChange={handleAmount}/>
                </p>
                <button onClick={handlePublish}>
                    <FormattedMessage {...messages.publishButton} />
                </button>
                <p><span className="bold italic">{publishResponse}</span></p>
            </div>
        </div>
        :
        <div className="outerDiv center">loading...</div>
        }
    </article>
  );
}