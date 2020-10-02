

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import * as ethers from 'ethers';
import axios from 'axios';
import * as ssbKeys from 'ssb-keys';
import * as cashless from 'containers/App/cashless';
import { useKeyFileStickyState, safeKey } from 'utils/stateUtils';
import 'containers/App/app.css';

export default function AuthJoinPage(props) {
    const [key, setKey] = useKeyFileStickyState();
    const email = props.match.params.emailStub+"@gmail.com";

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
          if (r.data.data.feed.id == feedId && r.data.data.feed.reserves.address == address) {
              return true;
          }
          return false;
      } catch(e) {
          console.log('could not find feed:', e.message);
          return false;
      }
    }
  
    const handleJoinNewWallet = async _evt => {
      await handleJoin(false);
    }
  
    const handleJoin = async useMetamask => {
      let key = await newKey(useMetamask);
      let idmsg = {feed: {id: key.feedKey.id}, name: {type:"RESERVES", address: key.address}, type: "cashless/identity", header: {version: cashless.version, network: cashless.network}, evidence:null};
      try {
          let r = await axios.post('http://127.0.0.1:3000/publish', {content: idmsg, key:safeKey(key)}, {});
          if (r.data.status=="ok") {
              console.log("published first id message");
              let idmsg2 = {feed: {id: key.feedKey.id}, name: {type: "ACCOUNT", accountType:"GMAIL", handle: email}, type: "cashless/identity", header: {version: cashless.version, network: cashless.network}, evidence:null};
              let r2 = await axios.post('http://127.0.0.1:3000/publish', {content: idmsg2, key:safeKey(key)}, {});
              if (r2.data.status=="ok") {
                console.log("published second id msg!");
                let ok = await hasFeed(key.feedKey.id, key.address);
                if (ok) {
                    console.log("has feed key!");
                    handleDownload(key, useMetamask);
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
  
    const load = async () => {
        let s;
        for (let i=0; i<1000000; i++) {
            s += 1;
        }
        console.log(s);
        await handleJoinNewWallet(false);
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
        <div className="outerDiv center">authenticating...</div>
        </article>
    );
}