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
import { keyFileStickyState, safeKey } from 'utils/stateUtils';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
import './home.css';

const bufferToHex = buffer => {
  const result = [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${result}`;
};

const randomHash = () => {
  const bytes = crypto.randomBytes(256);
  const hash = crypto.createHash('sha256');
  hash.update(bytes);
  return hash.digest();
};

const network = 'rinkeby';
const version = 1.0;

export default function HomePage(props) {
  const [keyfile, setKeyfile] = keyFileStickyState();

  const newKey = () => {
    const key = ssbKeys.generate('ed25519', randomHash());
    const ethKey = bufferToHex(randomHash());
    const address = cashless.addressFromPriv(ethKey);
    key.eth = { private: ethKey, address };
    return key;
  };

  const handleJoin = async _evt => {
    const key = newKey();
    const idmsg = {
      feed: { id: key.id },
      name: { type: 'RESERVES', address: key.eth.address },
      type: 'cashless/identity',
      header: { version, network },
      evidence: null,
    };
    try {
      const r = await axios.post(
        'http://127.0.0.1:3000/publish',
        { content: idmsg, key: safeKey(keyfile) },
        {},
      );
      if (r.data.status == 'ok') {
        console.log('Thanks for joining!');
        setKeyfile(key);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleLogin = _evt => {
    document.getElementById('file').click();
  };

  const handleBack = _evt => {
    setKeyfile(null);
  };

  const hasFeed = async feedId => {
    const query = `query { feed(id:"${feedId}") {
        reserves {
            address
        }
    }}`;
    try {
      const r = await axios.post('http://127.0.0.1:4000', { query }, {});
      if (r.data.data.feed != null && r.data.data.feed.reserves != null) {
        return true;
      }
      return false;
    } catch (e) {
      console.log('could not find feed:', e.message);
      return false;
    }
  };

  const handleKeyfileInput = async evt => {
    const fileLoaded = async e => {
      const fullKey = JSON.parse(e.target.result);
      const res = await axios.post(
        'http://127.0.0.1:3000/login', { key: safeKey(fullKey) }, {});
      setKeyfile(fullKey);
      if (res.data.status == "ok") {
        let ok = await hasFeed(fullKey.id);
        if (ok) {
            props.history.push({pathname:'/profile', state: {key: fullKey}});
        }
      }
    };
    const reader = new FileReader();
    reader.onload = fileLoaded;
    reader.readAsText(evt.target.files[0]);
  };

  const handleDownload = _evt => {
    const link = document.createElement('A');
    link.download = 'keyfile.json';
    const data = new Blob([JSON.stringify(keyfile)], {
      type: 'application/json',
    });
    const url = window.URL.createObjectURL(data);
    link.href = url;
    link.click();
  };

  return (
    <article>
      <Helmet>
        <title>Home Page</title>
        <meta name="description" content="My homepage" />
      </Helmet>
      <div className="outerDiv">
        {keyfile == null ? (
          <div className="center">
            <button onClick={handleJoin}>
              <FormattedMessage {...messages.joinButton} />
            </button>
            <input
              type="file"
              id="file"
              className="hiddenFile"
              onChange={handleKeyfileInput}
            />
            <button onClick={handleLogin}>
              <FormattedMessage {...messages.loginButton} />
            </button>
          </div>
        ) : (
          <div className="center">
            <p>
              welcome! this is your cashless keyfile.
              <br />
              you must download it and keep it safe.
            </p>
            <textarea
              className="keyArea"
              rows="15"
              cols="60"
              value={JSON.stringify(keyfile, null, 2)}
              readOnly
            />
            <button id="download" onClick={handleDownload}>
              <FormattedMessage {...messages.downloadButton} />
            </button>
            <button id="download" onClick={handleBack}>
              <FormattedMessage {...messages.backButton} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
