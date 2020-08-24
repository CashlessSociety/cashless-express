/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
//import H1 from 'components/H1';
//import axios from 'axios';
import * as ssbKeys from 'ssb-keys';
import * as crypto from 'crypto';
import * as ethers from 'ethers';
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


export default function HomePage() {

  const [keyfile, setKeyfile] = useState(null);

  const newKey = () => {
    let key = ssbKeys.generate("ed25519", randomHash());
    let ethKey = bufferToHex(randomHash());
    let wallet = new ethers.Wallet(ethKey);
    key.eth = {private: ethKey, address: wallet.address};
    return key;
  }

  const handleJoin = _evt => {
    let key = newKey();
    setKeyfile(key);
  }

  const handleLogin = _evt => {
    document.getElementById("file").click();
  }

  const handleKeyfileInput = evt => {
    const fileLoaded = e => {
      let d = JSON.parse(e.target.result);
      setKeyfile(d);
    }
    const reader = new FileReader();
    reader.onload = fileLoaded;
    reader.readAsText(evt.target.files[0]);
  }

  const handleDownload = evt => {
    let link = document.createElement('A');
    link.download ='keyfile.json';
    var data = new Blob([JSON.stringify(keyfile)], {type: 'application/json'});
    var url = window.URL.createObjectURL(data);
    link.href = url;
    link.click();
  }

  return (
    <article>
      <Helmet>
        <title>Home Page</title>
        <meta name="description" content="My homepage" />
      </Helmet>
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
    </article>
  );
}