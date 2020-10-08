/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useState, useEffect } from 'react';
import { decode } from 'url-safe-base64';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import TransactionBlob from 'components/TransactionBlob';
import 'containers/App/app.css';

const getPromiseChain = async (feedId, claimName) => {
    const query = `query { promiseChain(claimName:"`+claimName+`", feedId:"`+feedId+`") {
            author {
                id
            }
            nonce
        }}`;
    try {
        let r = await axios.post('http://127.0.0.1:4000', {query:query}, {});
        if (r.data.data.promiseChain != null) {
            let promises = r.data.data.promiseChain;

            const compare= (a, b) => {
                let comparison = 0;
                if (a.nonce > b.nonce) {
                  comparison = -1;
                } else if (a.nonce < b.nonce) {
                  comparison = 1;
                }
                return comparison;
            }

            return promises.sort(compare);
        }
    } catch(e) {
        console.log("error querying feed: ", e.message);
    }

    return [];
}

export default function TxDetailsPage(props) {
    const [loaded, setLoaded] = useState(false);
    const [promises, setPromises] = useState(null);
    const feedId = "@"+decode(props.match.params.feedId)+".ed25519";
    const claimName = props.match.params.claimName;
  
    const load = async () => {
        let promiseChain = await getPromiseChain(feedId, claimName);
        setPromises(promiseChain);
        setLoaded(true);
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
        <div className="outerDiv center">
            {promises.map(({ nonce }) => {return <TransactionBlob nonce={nonce} claimName={claimName} feedId={feedId}/>;})}
        </div>
        :
        <div className="outerDiv center">loading...</div>
        }
        </article>
    );
}