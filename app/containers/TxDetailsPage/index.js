/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useState, useEffect } from 'react';
import { decode } from 'url-safe-base64';
import { Helmet } from 'react-helmet';
import * as ethers from 'ethers';
import axios from 'axios';
import * as cashless from 'containers/App/cashless';
import TransactionBlob from 'components/TransactionBlob';
import { useKeyFileStickyState, safeKey } from 'utils/stateUtils';
import 'containers/App/app.css';

const providerURL = "https://"+cashless.network+".infura.io/v3/"+cashless.infuraAPIKey;

const toEth = (num) => {
    return num/ethers.utils.parseEther("1");
}

const getReservesAmount = async (address) => {
    try {
        let contract = cashless.contract(providerURL, null);
        let resp = await contract.functions.balanceOf(address);
        return toEth(resp);
    } catch(_e) {
        return 0;
    }
}

const verifySig = async (claim, sig, isSender) => {
    if (sig==null) {
        return false;
    }
    let fixedSig = {v: sig.v, r:Uint8Array.from(Buffer.from(sig.r.substring(2), 'hex')), s: Uint8Array.from(Buffer.from(sig.s.substring(2), 'hex'))};
    let data = Uint8Array.from(Buffer.from(claim.substring(2), 'hex'));
    let contract = cashless.contract(providerURL, null);
    return await cashless.verifyClaimSig(contract, data, fixedSig, isSender);
}

const getTransaction = async (feedId, claimName) => {
    const query = `query { promise(claimName:"`+claimName+`") {
            amount
            denomination
            vestDate
            nonce
            claimName
            isLatest
            sequence
            author {
                id
                reserves {
                    address
                }
                commonName {
                    name
                }
                verifiedAccounts {
                    handle
                    accountType
                }
            }
            recipient {
                id
                reserves {
                    address
                }
                commonName {
                    name
                }
                verifiedAccounts {
                    handle
                    accountType
                }
            }
            claim {
                data
                fromSignature {
                    v
                    r
                    s
                }
                toSignature {
                    v
                    r
                    s
                }
            }
        }}`;
    try {
        let r = await axios.post('http://127.0.0.1:4000', {query:query}, {});
        if (r.data.data.promise != null) {
            let promises = [];
            for (let i=0; i<r.data.data.promise.length; i++) {
                if (feedId == r.data.data.promise[i].author.id) {
                    console.log(r.data.data.promise[i].isLatest, r.data.data.promise[i].sequence);
                    try {
                        r.data.data.promise[i].fromSigCheck = await verifySig(r.data.data.promise[i].claim.data, r.data.data.promise[i].claim.fromSignature, true);
                        r.data.data.promise[i].toSigCheck = await verifySig(r.data.data.promise[i].claim.data, r.data.data.promise[i].claim.toSignature, false);
                        promises.push(r.data.data.promise[i]);
                    } catch(e) {
                        console.log(e.message);
                    }
                }
            }

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
    const [key, setKey] = useKeyFileStickyState();
    const [tx, setTx] = useState(null);
    const [reservesAmt, setReservesAmt] = useState(0);
    const feedId = "@"+decode(props.match.params.feedId)+".ed25519";
    const claimName = props.match.params.claimName;
  
    const load = async () => {
        //console.log(key.address);
        let transaction = await getTransaction(feedId, claimName);
        setTx(transaction);
        if (transaction.length > 0) {
            setReservesAmt(await getReservesAmount(transaction[0].author.reserves.address));
            //if (transaction[0].recipient.reserves!=null) {
                //console.log(transaction[0].recipient.reserves.address);
            //}
        }
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
            {tx.map(({ author, amount, recipient, vestDate, claim, fromSigCheck, toSigCheck, nonce, isLatest }) => {
                return <TransactionBlob 
                    author = {author}
                    amount = {amount}
                    vestDate = {vestDate}
                    claimData = {claim.data}
                    recipient = {recipient}
                    reservesAmt = {reservesAmt}
                    fromVerified = {fromSigCheck}
                    toVerified = {toSigCheck}
                    fromSignature = {claim.fromSignature}
                    nonce = {nonce}
                    claimName = {claimName}
                    isMyAsset = {(recipient.reserves!=null && key!=null) && (recipient.reserves.address==key.address)}
                    isLatest = {isLatest}
                />;
                })
            }
        </div>
        :
        <div className="outerDiv center">loading...</div>
        }
        </article>
    );
}