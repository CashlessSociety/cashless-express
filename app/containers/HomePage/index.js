/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import H2 from 'components/H1';
import axios from 'axios';
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
  const [loggedIn, setLoggedIn] = useState(false);
  const [lastQueryResult, setLastQueryResult] = useState(null);

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

  const handleKeyfileInput = async evt => {
    const fileLoaded = async e => {
      let d = JSON.parse(e.target.result);
      setKeyfile(d);
      delete d.eth;
      let res = await axios.post('http://127.0.0.1:3000/login', {key: d}, {});
      if (res.data.status == "ok") {
        setLoggedIn(true);
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

  const handlePublish = async _evt => {
    let promise = JSON.parse(document.getElementById('postPromise').value);
    console.log(promise);
    let res = await axios.post('http://127.0.0.1:3000/publish', {content: promise}, {});
    if (res.data.status=="ok") {
        document.getElementById('postPromise').value = "published!";
    }
  }

  const handleSeePromises = async _evt => {
      const authorId = document.getElementById('queryId').value;
      const query = 'query { promises(id: "'+authorId+`") {
        author {
            id
        }
        sequence
        timestamp
        vestDate
        from {
          address
          aliases {
            name
            hash
          }
        }
        to {
          address
          aliases {
            name
            hash
          }
        }
        reservesClaim {
          data
          fromSignature {
            v
            r
            s
          }
        }
      }
    }`;

    let res = await axios.post('http://127.0.0.1:4000', {query:query}, {});
    console.log('received graphql result');
    setLastQueryResult(res.data.data);
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
            <H2>
                Your ID:<br></br>{keyfile.id}
            </H2>
            <H2>
                <FormattedMessage {...messages.profileHeader} />
            </H2>
            <textarea id="postPromise" className='keyArea' rows="15" cols="60">
            </textarea>
            <button className="raise up" onClick={handlePublish}>
                <FormattedMessage {...messages.publishButton} />
            </button>
            <H2>
                <FormattedMessage {...messages.explorerHeader} />
            </H2>
            { lastQueryResult == null ? 
                <textarea className='keyArea' rows="10" cols="60" value="make a query!" readOnly></textarea>
                : 
                <textarea className='keyArea' rows="10" cols="60" value={JSON.stringify(lastQueryResult, null, 2)} readOnly></textarea>
            }
            <input type="text" size="50" id="queryId"/>
            <button className="raise up" onClick={handleSeePromises}>
                <FormattedMessage {...messages.viewButton} />
            </button>
        </div>
    }
    </article>
  );
}