

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import * as ethers from 'ethers';
import axios from 'axios';
import * as ssbKeys from 'ssb-keys';
import * as cashless from 'containers/App/cashless';
import TransactionBlob from 'components/TransactionBlob';
import { useKeyFileStickyState, safeKey } from 'utils/stateUtils';
import { signInWithGoogle, auth } from 'utils/firebase';
import 'containers/App/app.css';

const providerURL = "https://"+cashless.network+".infura.io/v3/"+cashless.infuraAPIKey;

const getReservesAmount = async (address) => {
	let contract = cashless.contract(providerURL, null);
    let resp = await contract.functions.balanceOf(address);
    return resp/ethers.utils.parseEther("1");
}

const getGrossAmount = (promises) => {
    let gross = 0;
    for (let i=0; i<promises.length; i++) {
        gross += promises[i].amount
    }

    return gross;
}

const uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

export default function AuthJoinPage(props) {
    const [key, setKey] = useKeyFileStickyState();
    const [loaded, setLoaded] = useState(false);
    const [idToken, setIdToken] = useState("");
    const [user, setUser] = useState(null);
    const [claims, setClaims] = useState([]);
    const [gross, setGross] = useState(0);
    const [useMetamask, setUseMetamask] = useState(false);
    const email = props.match.params.email;

    const newKey = async (metamask) => {
      let key = ssbKeys.generate("ed25519", cashless.randomHash());
      let signer;
      let address;
      let priv;
      if (metamask) {
          await window.ethereum.enable();
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          signer = provider.getSigner();
          address = await signer.getAddress();
          priv = null;
      } else {
          let ethKey = cashless.bufferToHex(cashless.randomHash());
          address = cashless.addressFromPriv(ethKey);
          priv = ethKey;
          signer = cashless.wallet("https://"+cashless.network+".infura.io/v3/"+cashless.infuraAPIKey, ethKey);
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
          let r = await axios.post('http://127.0.0.1:4000', {query:query}, {});
          console.log(r.data, r.data.data);
          console.log(feedId);
          if (r.data.data.feed.id == feedId && r.data.data.feed.reserves.address == address) {
              return true;
          }
          return false;
      } catch(e) {
          console.log('could not find feed:', e.message);
          return false;
      }
    }
  
    const handleJoin = async (key, evidence, email, metamask) => {
      let idmsg = {feed: {id: key.feedKey.id}, name: {type:"RESERVES", address: key.address}, type: "cashless/identity", header: {version: cashless.version, network: cashless.network}, evidence:null};
      try {
          let r = await axios.post('http://127.0.0.1:3000/publish', {content: idmsg, key:safeKey(key)}, {});
          if (r.data.status=="ok") {
              let idmsg2 = {feed: {id: key.feedKey.id}, name: {type: "ACCOUNT", accountType:"GOOGLE", handle: email}, type: "cashless/identity", header: {version: cashless.version, network: cashless.network}, evidence:evidence};
              let r2 = await axios.post('http://127.0.0.1:3000/publish', {content: idmsg2, key:safeKey(key)}, {});
              if (r2.data.status=="ok") {
                if (user.displayName!=null && user.displayName!= "") {
                    let idmsg3 = {feed: {id: key.feedKey.id}, name: {type: "COMMON", name:user.displayName, id:uuid()}, type: "cashless/identity", header: {version: cashless.version, network: cashless.network}, evidence:null};
                    let r3 = await axios.post('http://127.0.0.1:3000/publish', {content: idmsg3, key:safeKey(key)}, {});
                }
                let ok = await hasFeed(key.feedKey.id, key.address);
                if (ok) {
                    console.log("has feed key!");
                    handleDownload(key, metamask);
                    console.log("downloaded key!");
                    setKey(key);
                    props.history.push({pathname:'/profile'});
                }
              }
          }
      } catch(e) {
          console.log(e);
      }
    }

    const handleDownload = (key, metamask) => {
        let link = document.createElement('A');
        link.download ='key';
        let keyfile = JSON.parse(JSON.stringify(key.feedKey));
        if (metamask) {
            keyfile.eth = {private: null, address: key.address};
        } else {
            keyfile.eth = {private: key.private, address: key.address};
        }
        var data = new Blob([JSON.stringify(keyfile)], {type: 'application/json'});
        var url = window.URL.createObjectURL(data);
        link.href = url;
        link.click();
    }
  
    const handleSignIn = async () => {
        signInWithGoogle();
        auth.onAuthStateChanged(async user => {
            if (user) {
                setUser(user);
                let tok = await user.getIdToken(true);
                if (tok) {
                    setIdToken(tok);
                    setLoaded(true);
                }
            }
        });
    }

    const handleAuthJoin = async _evt => {
        if (user.emailVerified && user.email==email && idToken!="") {
            let key = await newKey(useMetamask);
            let r = await axios.post('http://127.0.0.1:3000/authenticatedEmail', {firebaseToken: idToken, ssbIdentity: key.feedKey.id}, {});
            if (r.data.status=="ok") {
                const query = `
                    query { messages(id:"`+r.data.verifierId+`") {
                      ... on IdentityMessage {
                        id
                        sequence
                        type
                        name {
                          type
                          ...on AccountHandle {
                            accountType
                            handle
                          }
                        }
                        feed {
                            id
                        }
                      }
                    }}`;
                let r2 = await axios.post('http://127.0.0.1:4000', {query:query}, {});
                let msgId;
                let sequence;
                if (r2.data.data.messages!=null && r2.data.data.messages.length>0) {
                    let msgs = r2.data.data.messages;
                    for (let i=0; i<msgs.length; i++) {
                        if (msgs[i].name != null && msgs[i].name.type=="ACCOUNT" && msgs[i].name.handle==email && msgs[i].feed.id==key.feedKey.id) {
                            console.log('found!');
                            msgId = msgs[i].id;
                            sequence = msgs[i].sequence;
                            break
                        }
                    }
                }
                if (msgId != null) {
                    let evidence = {type: "MESSAGE", id: msgId, feedId: r.data.verifierId, sequence: sequence};
                    await handleJoin(key, evidence, email, useMetamask);
                }
            }
        } else {
            console.log("email not verified");
        }
    }

    const load = async () => {
        const q1 = `query { allFeedIds }`;
        let r1 = await axios.post('http://127.0.0.1:4000', {query:q1}, {});
        let feedIds = r1.data.data.allFeedIds;
        let claims = [];
        for (let j=0;j<feedIds.length; j++) {
            let q2 = `query { pendingPromises(feedId:"`+feedIds[j]+`") {
                claimName
                nonce
                author {
                    id
                }
                recipient {
                    verifiedAccounts {
                        handle
                        accountType
                    }
                }
                amount
            }}`;
            let r2 = await axios.post('http://127.0.0.1:4000', {query:q2}, {});
            if (r2.data.data.pendingPromises != null && r2.data.data.pendingPromises.length>0) {
                let promises = r2.data.data.pendingPromises;
                for (let i=0; i<promises.length; i++) {
                    if (promises[i].recipient.verifiedAccounts[0].handle == email && promises[i].recipient.verifiedAccounts[0].accountType=="GOOGLE") {
                        claims.push(promises[i]);
                    }
                }
            }
        }
        setClaims(claims);
        setGross(getGrossAmount(claims));
        setLoaded(true);
    }

    useEffect(() => {
        (async () => await load())();
    }, []);

    return (
        <article>
        <Helmet>
            <title>Join Page</title>
            <meta name="description" content="My homepage" />
        </Helmet>
        {loaded ? 
            <div className="outerDiv center">
                <p className="center">Claim <span className="green">${gross}</span> in promises to {user!=null && user.email==email ? <span className="green">{email} ✔</span>:<span>{email} <span className="grey">(unverified)</span></span>}</p>
                {user!=null && user.email==email ? 
                    <p className="center"><button className="mini" onClick={handleAuthJoin}>claim your account</button></p>
                    :
                    <p className="center"><button className="mini" onClick={handleSignIn}>sign in with google</button></p>
                }
                {claims.map(({author, nonce, claimName}) => {return <TransactionBlob feedId={author.id} claimName={claimName} nonce={nonce}/>})}
            </div>
        :
            <div className="outerDiv center">loading...</div>
        }
        </article>
    );
}