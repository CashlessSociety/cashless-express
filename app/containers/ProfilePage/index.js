/*
 * ProfilePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import * as ethers from 'ethers';
import { encode } from 'url-safe-base64';
import * as cashless from 'containers/App/cashless';
import { useKeyFileStickyState, safeKey } from 'utils/stateUtils';
import { Link } from 'react-router-dom'
import 'containers/App/app.css';
import TransactionBlob from 'components/TransactionBlob';

const uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

const now = () => {
    return Math.floor(Date.now() / 1000);
}

const parsePromisesGross = (promises) => {
    let gross = 0;
    for (let i=0; i<promises.length; i++) {
        gross += promises[i].amount;
    }

    return gross;
}

const emptyHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
const providerURL = "https://"+process.env.CASHLESS_NETWORK+".infura.io/v3/"+process.env.INFURA_ID;

const getReservesAmount = async (address) => {
	let contract = cashless.contract(providerURL, null);
    let resp = await contract.functions.balanceOf(address);
    return resp/cashless.parseCoin("1");
}

export default function ProfilePage(props) {

  const [loaded, setLoaded] = useState(false);
  const [key, setKey] = useKeyFileStickyState();

  const [myFeed, setMyFeed] = useState(null);
  const [signer, setSigner] = useState(null);
  const [myPromises, setMyPromises] = useState([]);
  const [myReservesAmt, setMyReservesAmt] = useState(0.0);
  const [promisesToCommit, setPromisesToCommit] = useState([]);

  const [queryId, setQueryId] = useState("@");
  const [queryEmail, setQueryEmail] = useState("@gmail.com");
  const [promiseAmount, setAmount] = useState("0.00");
  const [queryFeed, setQueryFeed] = useState(null);
  const [publishResponse, setPublishResponse] = useState("Make a promise, due in 60 days");

  const [sendToEmail, setSendToEmail] = useState(false);
  const [changeName, setChangeName] = useState(false);
  const [newName, setNewName] = useState("");

  const [memo, setMemo] = useState("");
  const [rating, setRating] = useState("");

  const [isMetamask, setIsMetamask] = useState(false);
  const [seeTransactions, setSeeTransactions] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showCopyText, setShowCopyText] = useState(false);
  const [copyText, setCopyText] = useState("");

  const getMyFeed = async (feedId) => {
    const query = `query { feed(id:"`+feedId+`") {
        id
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
            vestDate
            nonce
            claimName
            author {
                id
            }
        }
        liabilities {
            amount
            vestDate
            nonce
            claimName
            author {
                id
            }
        }
        settledPromises {
            amount
            vestDate
            nonce
            claimName
            author {
                id
            }
        }
        settlements {
            tx
            claimName
        }
    }}`;
    try {
        let r = await axios.post("/graphql", {query:query}, {});
        if (r.data.data.feed != null && r.data.data.feed.reserves != null) {
            setMyFeed(r.data.data.feed);
            let promises = [];
            promises.push(...r.data.data.feed.assets);
            promises.push(...r.data.data.feed.liabilities);
            console.log(r.data.data.feed.settlements);
            const compare= (a, b) => {
                let comparison = 0;
                if (a.vestDate > b.vestDate) {
                  comparison = -1;
                } else if (a.vestDate < b.vestDate) {
                  comparison = 1;
                }
                return comparison;
            }

            promises = promises.sort(compare);
            promises.push(...r.data.data.feed.settledPromises);
            setMyPromises(promises);
            setMyReservesAmt(await getReservesAmount(r.data.data.feed.reserves.address));
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

  const getUpdateablePendingPromises = async (feedId) => {
    const q1 = `query { allFeedIds }`
    let r1 = await axios.post("/graphql", {query:q1}, {});
    let feedIds = r1.data.data.allFeedIds;
    const query = `query { pendingPromises(feedId:"`+feedId+`") {
        claimName
        recipient {
            verifiedAccounts {
                handle
                accountType
            }
        }
        amount
        vestDate
        memo
        serviceRating
    }}`;
    let updateablePromises = [];
    try {
        let r = await axios.post("/graphql", {query:query}, {});
        if (r.data.data.pendingPromises!=null && r.data.data.pendingPromises.length>0) {
            for (let j=0; j<feedIds.length; j++) {
                const q2 = `query { feed(id:"`+feedIds[j]+`") {
                    id
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
                }}`;
                let r2 = await axios.post("/graphql", {query:q2}, {});
                if (r2.data.data.feed.verifiedAccounts != null && r2.data.data.feed.verifiedAccounts.length>0) {
                    for (let i=0; i<r.data.data.pendingPromises.length; i++) {
                        if (r.data.data.pendingPromises[i].recipient.verifiedAccounts[0].handle == r2.data.data.feed.verifiedAccounts[0].handle) {
                            updateablePromises.push({id: r2.data.data.feed.id, commonName: r2.data.data.feed.commonName, reserves: r2.data.data.feed.reserves, promise: r.data.data.pendingPromises[i]});
                        }
                    }
                }
            }
        }
    } catch(e) {
        console.log('error getting pending promise:', e);
    }

    setPromisesToCommit(updateablePromises);
  }

  const load = async () => {
    if (!loaded) {
        if (key != null) {
            let ok = await getMyFeed(key.feedKey.id);
            await getUpdateablePendingPromises(key.feedKey.id);
            if (ok) {
                if (key.private == null) {
                    setIsMetamask(true);
                    await window.ethereum.enable();
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    let mySigner = provider.getSigner();
                    setSigner(mySigner);
                } else {
                    let wallet = cashless.wallet(providerURL, key.private);
                    setSigner(wallet);
                }
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
            verifiedAccounts {
                handle
                accountType
            }
          }
        }`;
      
        let r = await axios.post("/graphql", {query:query}, {});
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

  const handleNewName = evt => {
      setNewName(evt.target.value);
  }

  const handleChangeName = _evt => {
      setChangeName(true);
  }

  const handleSubmitName = async evt => {
    let idmsg = {feed: {id: key.feedKey.id}, name: {type:"COMMON", name: newName, id:uuid()}, type: "cashless/identity", header: {version: process.env.CASHLESS_VERSION, network: process.env.CASHLESS_NETWORK}, evidence:null};
    try {
        let r = await axios.post(process.env.HTTP_PROTOCOL+process.env.HOST+":"+PORT+"/publish", {content: idmsg, key:safeKey(key)}, {});
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
    if (isNaN(Number(rating))) {
        setPublishResponse("rating must be a number (1-5)");
        return
    }
    if (Number(rating)>5 || Number(rating)<1) {
        setPublishResponse("rating must be 1-5");
        return
    }
    let promise = {type: "cashless/promise", header: {version: process.env.CASHLESS_VERSION, network: process.env.CASHLESS_NETWORK}};
    let claimName = cashless.bufferToHex(cashless.randomHash());
    let issueTime = now();
    // !!!
    // Promises vest in 300 seconds rather than 60 days
    // !!!
    let vestTime = issueTime+(120);
    let voidTime = vestTime+(365*86400);
    promise.from = {id: myFeed.id, commonName: myFeed.commonName, reserves: myFeed.reserves, verifiedAccounts: myFeed.verifiedAccounts};
    if (!sendToEmail) {
        if (queryFeed==null) {
            setPublishResponse("must promise to an existing id");
        }
        if (queryFeed.id==key.feedKey.id) {
            setPublishResponse("cannot promise to yourself");
            return
        }
        // !!!
        // IMPORTANT: dispute period at 0 so settlements can happen immediately
        // !!!
        let disputeDuration = 0;
        let claimData = cashless.encodeClaim(promiseAmount, disputeDuration, vestTime, voidTime, key.address, queryFeed.reserves.address, claimName, emptyHash, 1);
        let claimSig;
        let contract = cashless.contract(providerURL, null);
        let libContract = cashless.libContract(providerURL);
        if (!isMetamask) {
            contract = contract.connect(signer);
            claimSig = await cashless.signClaim(contract, libContract, claimData);
        } else {
            let hash = await cashless.getClaimHash(contract, libContract, claimData);
            let rawSig = await signer.signMessage(hash);
            let res = ethers.utils.splitSignature(rawSig);
            claimSig = {v: res.v, r: Uint8Array.from(Buffer.from(res.r.substring(2), 'hex')), s: Uint8Array.from(Buffer.from(res.s.substring(2), 'hex'))};
        }
        let j = await cashless.verifyClaimSig(contract, claimData, claimSig, true);
        if (!j) {
            console.log("claim signature failed validation");
            return
        }
        promise.to = queryFeed;
        promise.promise = {serviceRating: Number(rating), memo: memo, nonce:1, claimName: claimName, denomination:"USD", amount: Number(promiseAmount), issueDate: issueTime, vestDate: vestTime, fromSignature:{v: claimSig.v, r: cashless.bufferToHex(claimSig.r), s: cashless.bufferToHex(claimSig.s)}, claimData:cashless.bufferToHex(claimData)};
    } else {
        //
        // Enforce GMAIL emails ONLY... but there are google accounts that dont end with @gmail.com
        //
        /*if (queryEmail.length>10 && queryEmail.substring(queryEmail.length-10, queryEmail.length) != "@gmail.com") {
            setPublishResponse("cannot promise to: "+queryEmail+ "(gmail only)");
            return
        }*/
        promise.to = {verifiedAccounts: [{handle: queryEmail, accountType:"GOOGLE"}]};
        promise.promise = {serviceRating: Number(rating), memo:memo, nonce:0, claimName: claimName, denomination:"USD", amount: Number(promiseAmount), issueDate: issueTime, vestDate: vestTime};
    }
    let res = await axios.post('/publish', {content: promise, key:safeKey(key)}, {});
    if (res.data.status=="ok") {
        setMyFeed(null);
        setQueryId("@");
        setQueryFeed(null);
        setAmount("0.00");
        setQueryEmail("@gmail.com");
        setShowSend(false);
        setSeeTransactions(false);
        if (sendToEmail) {
            setCopyText(memo+" claim $"+promiseAmount+" here: "+"/join/auth/"+queryEmail);
            setShowCopyText(true);
        }
        await getMyFeed(key.feedKey.id);
        await getUpdateablePendingPromises(key.feedKey.id);
    }
  }

  const handleUpdatePromise = async evt => {
    let pendingPromise;
    for (let i=0; i<promisesToCommit.length; i++) {
        if (evt.target.id==promisesToCommit[i].promise.claimName) {
            pendingPromise = promisesToCommit[i];
            break
        }
    }
    let promise = {type: "cashless/promise", header: {version: process.env.CASHLESS_VERSION, network: process.env.CASHLESS_NETWORK}};
    let issueTime = now();
    let vestTime = pendingPromise.promise.vestDate;
    let voidTime = vestTime+(365*86400);
    promise.from = {id: myFeed.id, commonName: myFeed.commonName, reserves: myFeed.reserves, verifiedAccounts: myFeed.verifiedAccounts};
    let claimName = pendingPromise.promise.claimName;
    let amount = pendingPromise.promise.amount;
    let disputeDuration = 0;
    //console.log(amount.toString(), disputeDuration, vestTime, voidTime, key.address, pendingPromise.reserves.address, claimName, emptyHash, 1);
    let claimData = cashless.encodeClaim(amount.toString(), disputeDuration, vestTime, voidTime, key.address, pendingPromise.reserves.address, claimName, emptyHash, 1);
    let claimSig;
    let contract = cashless.contract(providerURL, null);
    let libContract = cashless.libContract(providerURL);
    if (!isMetamask) {
        contract = contract.connect(signer);
        claimSig = await cashless.signClaim(contract, libContract, claimData);
    } else {
        let hash = await cashless.getClaimHash(contract, libContract, claimData);
        let rawSig = await signer.signMessage(hash);
        let res = ethers.utils.splitSignature(rawSig);
        claimSig = {v: res.v, r: Uint8Array.from(Buffer.from(res.r.substring(2), 'hex')), s: Uint8Array.from(Buffer.from(res.s.substring(2), 'hex'))};
    }
    let j = await cashless.verifyClaimSig(contract, claimData, claimSig, true);
    if (!j) {
        console.log("claim signature failed validation");
        return
    }
    promise.to = {id: pendingPromise.id, reserves: pendingPromise.reserves, commonName: pendingPromise.commonName, verifiedAccounts: pendingPromise.promise.recipient.verifiedAccounts};
    promise.promise = {memo: pendingPromise.promise.memo, serviceRating: pendingPromise.promise.serviceRating, nonce:1, claimName: claimName, denomination:"USD", amount: Number(amount), issueDate: issueTime, vestDate: vestTime, fromSignature:{v: claimSig.v, r: cashless.bufferToHex(claimSig.r), s: cashless.bufferToHex(claimSig.s)}, claimData:cashless.bufferToHex(claimData)};
    let res = await axios.post("/publish", {content: promise, key:safeKey(key)}, {});
    if (res.data.status=="ok") {
        setMyFeed(null);
        setSeeTransactions(false);
        await getMyFeed(key.feedKey.id);
        await getUpdateablePendingPromises(key.feedKey.id);
    }
  }

  const renderAssets = () => {
      let gross = parsePromisesGross(myFeed.assets);
      return (
        <span className="green">${gross.toFixed(2)}</span>
      );
  }

  const renderLiabilities = () => {
    let gross = parsePromisesGross(myFeed.liabilities);
    return (
      <span className="red">${gross.toFixed(2)}</span>
    );
  }

  const handleSeeTransactions = _evt => {
      setSeeTransactions(true);
  }

  const handleHideTransactions = _evt => {
      setSeeTransactions(false);
  }

  const handleShowSend = _evt => {
      setShowSend(true);
  }

  const handleChangeCopyText = evt => {
      setCopyText(evt.target.value);
  }

  const handleCopyText = _evt => {
    let text = document.getElementById("copyThis");
    text.select();
    document.execCommand("copy");
  }

  const handleHideCopy = _evt => {
    setShowCopyText(false);
  }

  const handleRating = evt => {
      setRating(evt.target.value);
  }

  const handleMemo = evt => {
      setMemo(evt.target.value);
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
        {loaded && myFeed!=null ?
        <div className="outerDiv column">
            <div>
                <br></br>
                <br></br>
                {changeName==false ?
                <p>
                    {myFeed.commonName==null ? <span>(unknown)</span>:<span>{myFeed.commonName.name}</span>}&nbsp;<button className="mini" onClick={handleChangeName}>change name</button>
                </p>
                :
                <p>
                    <input type="text" className="textField" value={newName} onChange={handleNewName}/>
                    &nbsp;<button className="mini" onClick={handleSubmitName}>submit</button>
                </p>
                }
                <p>
                    {myFeed.verifiedAccounts != null ? 
                        myFeed.verifiedAccounts.map(({handle}) => {return <span className="green">{handle} ✔ </span>})
                    :
                    <span></span>
                    }
                </p>
                <p>
                    <span className="bold">Cash Reserves</span>: {'$'+myReservesAmt.toFixed(2)}
                </p>
                <p>
                    <span className="bold">Incoming</span>: {renderAssets()}
                </p>
                <p>
                    <span className="bold">Outgoing</span>: {renderLiabilities()}
                </p>
            </div>
            {!seeTransactions ?
                <p><button className="mini" onClick={handleSeeTransactions}>transactions</button></p>
                :
                <span><p><button className="mini" onClick={handleHideTransactions}>hide transactions</button></p>
                <span>
                {myPromises.map(({ claimName, nonce, author }) => {
                    return <TransactionBlob claimName={claimName} nonce={nonce} feedId={author.id} isStub={true} />;
                })}</span></span>
            }
            <div>
                <ul>
                    {promisesToCommit.map(({id, promise}) => {
                        return <li><div className="borderedDiv"><p>{promise.recipient.verifiedAccounts[0].handle + " has verified account: "}<Link to={"/feed/"+encode(id.substring(1, id.length-8))}>{id.substring(0, 6)+'...'}</Link><button className="mini" id={promise.claimName} onClick={handleUpdatePromise}>commit promise</button></p></div></li>;
                    })}
                </ul>
            </div>
            {showSend ?
            <div className="borderedDiv">
                <p>
                    {sendToEmail==false ?
                    <span>
                        <span className="bold">ID</span>:&nbsp;
                        {queryFeed==null  ?
                            <span><input type="text" className="textField" value={queryId} onChange={handleQueryId}/> <button className="mini" onClick={handleSendToEmail}>send to email</button></span>
                            :
                            <span><span className="green">{queryFeed.commonName==null ? queryFeed.id.substring(0, 5)+"...   ("+queryFeed.reserves.address+")" : queryFeed.id.substring(0, 5)+"...   ("+queryFeed.commonName.name+")"}</span>&nbsp;&nbsp;<button className="mini" onClick={handleCancel}>change</button></span>
                        }
                    </span>
                    :
                    <span>
                        <span className="bold">Email</span>:&nbsp;
                        <input type="text" className="textField" value={queryEmail} onChange={handleQueryEmail}/> <button className="mini" onClick={handleSendToId}>send to id</button>
                    </span>
                    }   
                </p>
                <p>
                    <span className="bold">Amount</span>:&nbsp;<input type="text" className="textField" value={promiseAmount} onChange={handleAmount}/>
                </p>
                <p>
                    <span className="bold">Note</span>:&nbsp;<input type="text" className="textField" value={memo} onChange={handleMemo}/>
                </p>
                <p>
                    <span className="bold">Quality Rating</span> (1-5):&nbsp;<input type="text" className="textField" value={rating} onChange={handleRating}/>
                </p>
                <button className="blackButton" onClick={handlePublish}>
                    send
                </button>
                <p><span className="bold italic">{publishResponse}</span></p>
            </div>
            :
            <div>
                <button className="blackButton" onClick={handleShowSend}>
                    make a promise
                </button>
            </div>
            }
            {showCopyText ?
            <div>
                <p>
                    <textarea id="copyThis" value={copyText} onChange={handleChangeCopyText} rows="2" cols="60"/>
                    <br></br>
                    <button className="mini" onClick={handleCopyText}>copy to clipboard</button> <button className="mini" onClick={handleHideCopy}>done</button>
                </p>
            </div>
            :
            <div></div>
            }
        </div>
        :
        <div className="outerDiv center">loading...</div>
        }
    </article>
  );
}
