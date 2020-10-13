/*
 * ProfilePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import { decode } from 'url-safe-base64';
import * as cashless from 'containers/App/cashless';
import { useKeyFileStickyState, safeKey } from 'utils/stateUtils';
import 'containers/App/app.css';
import TransactionBlob from 'components/TransactionBlob';

const parsePromisesGross = (promises) => {
    let gross = 0;
    let grossPending = 0;
    for (let i=0; i<promises.length; i++) {
        if (promises[i].nonce > 0) {
            gross += promises[i].amount;
        } else if (promises[i].nonce==0) {
            grossPending += promises[i].amount;
        }
    }

    return {gross: gross, grossPending: grossPending};
}

const providerURL = "https://"+cashless.network+".infura.io/v3/"+cashless.infuraAPIKey;

const getReservesAmount = async (address) => {
	let contract = cashless.contract(providerURL, null);
    let resp = await contract.functions.balanceOf(address);
    return resp/cashless.parseCoin("1");
}

export default function ProfilePage(props) {

  const [loaded, setLoaded] = useState(false);

  const [myFeed, setMyFeed] = useState(null);
  const [myPromises, setMyPromises] = useState([]);
  const [myReservesAmt, setMyReservesAmt] = useState(0.0);
  const feedId = "@"+decode(props.match.params.id)+".ed25519";

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
        let r = await axios.post('http://127.0.0.1:4000', {query:query}, {});
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

  const load = async () => {
    if (!loaded) {
        let ok = await getMyFeed(feedId);
        if (ok) {
            setLoaded(true);
        }
    }
  }

  const renderAssets = () => {
      let promiseAmounts = parsePromisesGross(myFeed.assets);
      return (
        <span><span className="green">${promiseAmounts.gross.toFixed(2)}</span> {promiseAmounts.grossPending>0 ? <span>{'(pending: '}<span className="yellow">${promiseAmounts.grossPending.toFixed(2)}</span>{')'}</span>:<span></span>}</span>
      );
  }

  const renderLiabilities = () => {
    let promiseAmounts = parsePromisesGross(myFeed.liabilities);
    return (
      <span><span className="red">${promiseAmounts.gross.toFixed(2)}</span> {promiseAmounts.grossPending>0 ? <span>{'(pending: '}<span className="yellow">${promiseAmounts.grossPending.toFixed(2)}</span>{')'}</span>:<span></span>}</span>
    );
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
                <p>
                    {myFeed.commonName==null ? <span>(unknown)</span>:<span>{myFeed.commonName.name}</span>}&nbsp;
                </p>
                <p>
                    {myFeed.verifiedAccounts != null ? 
                        myFeed.verifiedAccounts.map(({handle}) => {return <span className="green">{handle} ✔ </span>})
                    :
                    <span></span>
                    }
                </p>
                <p>
                    <span className="bold under">Cash Reserves</span>: {'$'+myReservesAmt.toFixed(2)} {myFeed.reserves!=null ? "("+myFeed.reserves.address+")":""}
                </p>
                <p>
                    <span className="bold under">Incoming</span>: {renderAssets()}
                </p>
                <p>
                    <span className="bold under">Outgoing</span>: {renderLiabilities()}
                </p>
                {myPromises.map(({ claimName, nonce, author }) => {
                    return <TransactionBlob claimName={claimName} nonce={nonce} feedId={author.id} isStub={true} />;
                })}
            </div>
        </div>
        :
        <div className="outerDiv center">loading...</div>
        }
    </article>
  );
}
