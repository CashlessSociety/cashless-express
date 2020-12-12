/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import 'containers/App/app.css';
import TransactionBlob from 'components/TransactionBlob';

const getTransactions = async () => {
    const query = `query { allPromises {
            nonce
            claimName
            timestamp
            isLatest
            author {
                id
            }
        }}`;
    try {
        let r = await axios.post("/graphql", {query:query}, {});
        if (r.data.data.allPromises != null) {
            let promises = [];
            for (let i=0; i<r.data.data.allPromises.length; i++) {
                if (r.data.data.allPromises[i].isLatest) {
                    promises.push(r.data.data.allPromises[i]);
                }
            }
            const compare= (a, b) => {
                let comparison = 0;
                if (a.timestamp > b.timestamp) {
                  comparison = -1;
                } else if (a.timestamp < b.timestamp) {
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

export default function ExplorePage() {
    const [loaded, setLoaded] = useState(false);
    const [txs, setTxs] = useState([]);
  
    const load = async () => {
        let transactions = await getTransactions();
        setTxs(transactions);
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
            {txs.map(({ author, nonce, claimName }) => {
                return <TransactionBlob nonce={nonce} claimName={claimName} feedId={author.id} isStub={true}/>
            })}
        </div>
        :
        <div className="outerDiv center">loading...</div>
        }
        </article>
    );
}