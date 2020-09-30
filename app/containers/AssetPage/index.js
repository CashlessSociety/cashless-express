/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import * as ethers from 'ethers';
import * as cashless from 'containers/App/cashless';
import TransactionBlob from 'components/TransactionBlob';
import 'containers/App/app.css';

const providerURL = "https://"+cashless.network+".infura.io/v3/"+cashless.infuraAPIKey;

const toEth = (num) => {
    return num/ethers.utils.parseEther("1");
}

const getReservesAmount = async (address) => {
	let contract = cashless.contract(providerURL, null);
    let resp = await contract.functions.balanceOf(address);
    return toEth(resp);
}

const verifyAsset = async (claim, sig, vestDate) => {
    let fixedSig = {v: sig.v, r:Uint8Array.from(Buffer.from(sig.r.substring(2), 'hex')), s: Uint8Array.from(Buffer.from(sig.s.substring(2), 'hex'))};
    let data = Uint8Array.from(Buffer.from(claim.substring(2), 'hex'));
    console.log("hey!");
    let decoded = cashless.decodeClaim(data);
    if (decoded[0][2] != vestDate) {
        console.log(decoded[0]);
        return false;
    }
    let contract = cashless.contract(providerURL, null);
    return await cashless.verifyClaimSig(contract, data, fixedSig, true);
}

const fromEth = (num) => {
    return ethers.utils.parseEther(num.toString());
}

export default function AssetPage(props) {
    const [loaded, setLoaded] = useState(false);
    const [key, setKey] = useState(null);
    const [signer, setSigner] = useState(null);
    const [feed, setFeed] = useState(null);
    const [contract, setContract] = useState(null);
    const [allVerified, setAllVerified] = useState(null);
    const [allReserves, setAllReserves] = useState(null);
  
    const loadKey = async () => {
        if (props.location.state!=null && props.location.state.key!=null) {
            setKey(props.location.state.key);
            let mySigner;
            if (props.location.state.key.private != null) {
                mySigner = cashless.wallet(providerURL, props.location.state.key.private);
            } else {
                await window.ethereum.enable();
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                mySigner = provider.getSigner();
            }
            let myContract = cashless.contract(providerURL, mySigner);
            setContract(myContract);
            setSigner(mySigner);
            let reserves = {};
            let verified = {};
            for (let i=0;i<props.location.state.feed.assets.length;i++) {
                reserves[props.location.state.feed.assets[i].claimName] = await getReservesAmount(props.location.state.feed.assets[i].author.reserves.address); 
                verified[props.location.state.feed.assets[i].claimName] = await verifyAsset(props.location.state.feed.assets[i].claim.data, props.location.state.feed.assets[i].claim.fromSignature, props.location.state.feed.assets[i].vestDate);
            }
            setFeed(props.location.state.feed);
            setAllReserves(reserves);
            setAllVerified(verified);
            setLoaded(true);
        } else {
            props.history.push({pathname: '/'});
        }
    }

    useEffect(() => {
        (async () => await loadKey())();
      }, []);

    return (
        <article>
        <Helmet>
            <title>Home Page</title>
            <meta name="description" content="My homepage" />
        </Helmet>
        {loaded ?
        <div className="outerDiv center">
            {
            feed.assets.map(({ amount, author, vestDate, claim, claimName, nonce }) => {
            return <TransactionBlob 
                author = {author}
                amount = {amount}
                vestDate = {vestDate}
                claimData = {claim.data}
                recipient = {{id: feed.id, commonName: feed.commonName, reserves: feed.reserves}}
                reservesAmt = {allReserves[claimName]}
                isVerified = {allVerified[claimName]}
                nonce = {nonce}
                isMyAsset = {true}
            />;
            })}
        </div>
        :
        <div className="outerDiv center">loading...</div>
        }
        </article>
    );
}