/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import * as ethers from 'ethers';
import { encode, decode } from 'url-safe-base64';
import * as cashless from 'containers/App/cashless';
import { useKeyFileStickyState, safeKey } from 'utils/stateUtils';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
import { Link } from 'react-router-dom';
import 'containers/App/app.css';

const getGrossAmount = (promises) => {
    let gross = 0
    for (let i=0; i<promises.length; i++) {
        gross += promises[i].amount
    }

    return gross;
}

const now = () => {
    return Math.floor(Date.now() / 1000);
}

const providerURL = "https://"+cashless.network+".infura.io/v3/"+cashless.infuraAPIKey;

const getReservesAmount = async (address) => {
	let contract = cashless.contract(providerURL, null);
    let resp = await contract.functions.balanceOf(address);
    return resp/ethers.utils.parseEther("1");
}

export default function PortfolioPage(props) {

  const [loaded, setLoaded] = useState(false);
  const [key, setKey] = useKeyFileStickyState();

  const [myFeed, setMyFeed] = useState(null);
  const [myReserves, setMyReserves] = useState(0.0);

  const feedId = "@"+decode(props.match.params.id)+".ed25519";

  const getFeed = async (feedId) => {
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
            denomination
            vestDate
            nonce
            claimName
            author {
                id
                reserves {
                    address
                }
                commonName {
                    name
                }
            }
            claim {
                data
                fromSignature {
                    v
                    r
                    s
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
            claimName
            amount
            denomination
            vestDate
            nonce
            claim {
                data
                fromSignature {
                    v
                    r
                    s
                }
            }
        }
    }}`;
    try {
        let r = await axios.post('http://127.0.0.1:4000', {query:query}, {});
        if (r.data.data.feed != null && r.data.data.feed.reserves != null) {
            setMyFeed(r.data.data.feed);
            setMyReserves(await getReservesAmount(r.data.data.feed.reserves.address));
            return true;
        } else {
            console.log('failed to find feed...', r.data.data.feed);
        }
        return false;
    } catch(e) {
        console.log('could not find feed:', e.message);
        return false;
    }
  }

  const load = async () => {
    if (!loaded) {
        console.log("my feed id:", feedId);
        let ok = await getFeed(feedId);
        if (ok) {
            setLoaded(true);
        }
    }
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
        <div className="outerDiv column">
            <div>
                <p><span className="bold under"><FormattedMessage {...messages.nameHeader} /></span>:&nbsp;
                    {myFeed.commonName==null ? <span><FormattedMessage {...messages.unknown} /></span>:<span>{myFeed.commonName.name}</span>}
                </p>
                <p>
                    <span className="bold under"><FormattedMessage {...messages.idHeader} /></span>: {myFeed.id}
                </p>
                <p>
                    <span className="bold under"><FormattedMessage {...messages.reservesHeader} /></span>: {'$'+myReserves.toFixed(2).toString()}
                </p>
                <p>
                    <span className="bold under"><FormattedMessage {...messages.incomingHeader} /></span>: <span className="green">{'$'+getGrossAmount(myFeed.assets).toFixed(2).toString()}</span>
                </p>
                <ul>
                    {myFeed.assets.map(({ author, claimName, amount, vestDate }) => {
                        let s = encode(author.id.substring(1, author.id.length-8));
                        return  <li><Link to={"/promise/"+s+"/"+claimName} className="oldLink">From: {author.commonName!=null ? author.commonName.name: author.id.substring(0, 6)} Amount: ${amount} Due Date: {vestDate - now() > 0 ? <span>{(new Date(vestDate*1000)).toLocaleString()}</span>:<span>Available Now</span>}</Link></li>;
                    })}
                </ul>
                <p>
                    <span className="bold under"><FormattedMessage {...messages.outgoingHeader} /></span>: <span className="red">{'$'+getGrossAmount(myFeed.liabilities).toFixed(2).toString()}</span>
                </p>
                <ul>
                    {myFeed.liabilities.map(({ recipient, claimName, amount, vestDate })=> {
                        let s = encode(myFeed.id.substring(1, myFeed.id.length-8));
                        return  <li><Link to={"/promise/"+s+"/"+claimName} className="oldLink">To: {recipient.commonName!=null ? recipient.commonName.name: <span>{recipient.id!=null ? recipient.id.substring(0,6): recipient.verifiedAccounts[0].handle}</span>} Amount: ${amount} Due Date: {vestDate - now() > 0 ? <span>{(new Date(vestDate*1000)).toLocaleString()}</span>:<span>Available Now</span>}</Link></li>;
                    })}
                </ul>
            </div>
        </div>
        :
        <div className="outerDiv center">loading...</div>
        }
    </article>
  );
}
