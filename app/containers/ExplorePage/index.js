/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import { Link } from 'react-router-dom';
import 'containers/App/app.css';
import { encode } from 'url-safe-base64';

const getTransactions = async () => {
    const query = `query { allPromises {
            amount
            issueDate
            vestDate
            nonce
            claimName
            author {
                id
                commonName {
                    name
                    id
                }
                verifiedAccounts {
                    handle
                    accountType
                }
            }
            recipient {
                id
                commonName {
                    name
                    id
                }
                verifiedAccounts {
                    handle
                    accountType
                }
            }
        }}`;
    try {
        let r = await axios.post('http://127.0.0.1:4000', {query:query}, {});
        if (r.data.data.allPromises != null) {
            let promises = r.data.data.allPromises;

            const compare= (a, b) => {
                let comparison = 0;
                if (a.issueDate > b.issueDate) {
                  comparison = -1;
                } else if (a.issueDate < b.issueDate) {
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
            {txs.map(({ author, nonce, recipient, issueDate, claimName, amount }) => {
                let sId = encode(author.id.substring(1, author.id.length-8));
                let rId;
                if (recipient.id!=null) {
                    rId = encode(recipient.id.substring(1, recipient.id.length-8));
                }
            return <div className="borderedDiv long"><p className="leftAlign">claim: <Link to={"/promise/"+sId+"/"+claimName} className="oldLink">{claimName.substring(0,25)+'...'}</Link> nonce: {nonce} timestamp: {issueDate}<br></br>From: <Link to={"/feed/"+sId} className="oldLink">{author.id.substring(0, 16)+'...'}</Link> To: {recipient.id != null ? <Link to={"/feed/"+rId} className="oldLink">{recipient.id.substring(0, 16)+'...'}</Link>:recipient.verifiedAccounts[0].handle} Amount: {amount}</p></div>;
            })}
        </div>
        :
        <div className="outerDiv center">loading...</div>
        }
        </article>
    );
}