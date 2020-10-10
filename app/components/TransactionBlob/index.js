import './tx.css';
import React, { useState, useEffect } from 'react';
import { encode } from 'url-safe-base64';
import * as cashless from 'containers/App/cashless';
import * as ethers from 'ethers';
import axios from 'axios';
import { useKeyFileStickyState, safeKey } from 'utils/stateUtils';
import { Link } from 'react-router-dom';

const providerURL = "https://"+cashless.network+".infura.io/v3/"+cashless.infuraAPIKey;

const toUSD = (num) => {
    return num/cashless.parseCoin("1");
}

const getReservesAmount = async (address) => {
    try {
        let contract = cashless.contract(providerURL, null);
        let resp = await contract.functions.balanceOf(address);
        return toUSD(resp);
    } catch(_e) {
        return 0;
    }
}

const verifySig = async (claim, sig, isSender) => {
    try {
        let fixedSig = {v: sig.v, r:Uint8Array.from(Buffer.from(sig.r.substring(2), 'hex')), s: Uint8Array.from(Buffer.from(sig.s.substring(2), 'hex'))};
        let data = Uint8Array.from(Buffer.from(claim.substring(2), 'hex'));
        let contract = cashless.contract(providerURL, null);
        return await cashless.verifyClaimSig(contract, data, fixedSig, isSender);
    } catch(_e) {
        return false;
    }
}

const now = () => {
    return Math.floor(Date.now() / 1000);
}

const getClaim = (claimString) => {
    let data = Uint8Array.from(Buffer.from(claimString.substring(2), 'hex'));
    let claim = cashless.decodeClaim(data);
    let readableClaim = {amount: toUSD(claim[0][0]), disputeDuration: Number(claim[0][1]), vestTimestamp: Number(claim[0][2]), voidTimestamp: Number(claim[0][3]), senderAddress: "0x"+claim[1][0], receiverAddress: "0x"+claim[1][1], claimName: cashless.bufferToHex(claim[2][0]), loopID: cashless.bufferToHex(claim[2][1]), nonce: Number(claim[3])};
    return JSON.stringify(readableClaim, null, 4);
}

const getPromise = async (feedId, claimName, nonce) => {
    const query = `query { promise(claimName:"`+claimName+`", feedId:"`+feedId+`", nonce:`+nonce+`) {
        amount
        id
        denomination
        vestDate
        nonce
        claimName
        isLatest
        sequence
        timestamp
        author {
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
        }
        recipient {
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
        return r.data.data.promise;
    } catch(e) {
        console.log('failed graphql query:', e.message)
    }
}

function TransactionBlob(props) {

    const [seeDetails, setSeeDetails] = useState(false);
    const [key, setKey] = useKeyFileStickyState();
    const [isJSON, setIsJSON] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [promise, setPromise] = useState(null);
    const [reservesAmt, setReservesAmt] = useState(0);
    const [isMyAsset, setIsMyAsset] = useState(false);
    const [isMyLiability, setIsMyLiability] = useState(false);
    const [fromSigVerified, setFromSigVerified] = useState(false);
    const [toSigVerified, setToSigVerified] = useState(false);
    const [settled, setSettled] = useState(false);

    const handleSeeDetails = _evt => {
        setSeeDetails(true);
    }

    const handleHideDetails = _evt => {
        setSeeDetails(false);
    }

    const handleSwitchJSON = _evt => {
        setIsJSON(!isJSON);
    }

    const handleClaimPromise = async _evt => {
        console.log("attempting settlement");
        let data = Uint8Array.from(Buffer.from(promise.claimData.substring(2), 'hex'));
        console.log(data);
        let contract = cashless.contract(providerURL, null);
        let libContract = cashless.libContract(providerURL);
        let claimSig;
        if (key.private != null) {
            let wallet = cashless.wallet(providerURL, key.private);
            contract = contract.connect(wallet);
            claimSig = await cashless.signClaim(contract, libContract, data);
        } else {
            await window.ethereum.enable();
            let provider = new ethers.providers.Web3Provider(window.ethereum);
            let signer = provider.getSigner();
            let hash = await cashless.getClaimHash(contract, libContract, data);
            let rawSig = await signer.signMessage(hash);
            let res = ethers.utils.splitSignature(rawSig);
            claimSig = {v: res.v, r: Uint8Array.from(Buffer.from(res.r.substring(2), 'hex')), s: Uint8Array.from(Buffer.from(res.s.substring(2), 'hex'))};
        }
        let j = await cashless.verifyClaimSig(contract, data, claimSig, false);
        if (!j) {
            console.log("claim signature failed validation");
            return
        }
        let receiverSig = claimSig;
        let senderSig = {v: promise.fromSignature.v, r: Uint8Array.from(Buffer.from(promise.fromSignature.r.substring(2), 'hex')), s: Uint8Array.from(Buffer.from(promise.fromSignature.s.substring(2), 'hex'))};
        let txh;
        if (key.private != null) {
            let wallet = cashless.wallet(providerURL, key.private);
            contract = contract.connect(wallet);
            txh = await cashless.proposeSettlementTx(contract, data, senderSig, receiverSig);
        } else {
            await window.ethereum.enable();
            let provider = new ethers.providers.Web3Provider(window.ethereum);
            let signer = provider.getSigner();
            contract = contract.connect(signer);
            txh = await cashless.proposeSettlementTx(contract, data, senderSig, receiverSig);
        }
        console.log(txh);
    }

    const load = async () => {
        let prom = await getPromise(props.feedId, props.claimName, Number(props.nonce));
        if (prom!=null) {
            setPromise(prom);
            if (!props.isStub) {
                setReservesAmt(await getReservesAmount(prom.author.reserves.address));
                setFromSigVerified(await verifySig(prom.claim.data, prom.claim.fromSignature, true));
                setToSigVerified(await verifySig(prom.claim.data, prom.claim.toSignature, false));
            }
            if (prom.recipient.reserves!=null && key!=null && prom.recipient.reserves.address==key.address) {
                setIsMyAsset(true);
            }
            if (prom.author.reserves!=null && key!=null && prom.author.reserves.address==key.address) {
                setIsMyLiability(true);
            }
            setLoaded(true);
        } else {
            console.log("error: null promise!");
        }
    }

    useEffect(() => {
        (async () => await load())();
    }, []);

    return (
        <div>
            {loaded ?
            <div className={promise.isLatest ? "blobOuter center": "bgGrey blobOuter center"}>
                <div>
                    <table className= "blobTable leftAlign">
                        <col className="width20"></col>
                        <col className="width40"></col>
                        <col className="width40"></col>
                        <tbody>
                        <tr>
                            <td><h1><span className={promise.nonce==0 ? "yellow":!isMyAsset && !isMyLiability ? "black":isMyAsset ? "green": "red"}><strong>{!isMyAsset && !isMyLiability ? "":isMyAsset ? "+":"-"}${promise.amount.toFixed(2)}</strong></span></h1></td>
                            <td><h1>From: <strong><Link to={"/feed/"+encode(promise.author.id.substring(1, promise.author.id.length-8))} className="oldLink">{promise.author.commonName == null ? promise.author.id.substring(0, 10)+'...': promise.author.commonName.name}</Link></strong></h1></td>
                            <td><h1>To: <strong>{promise.recipient.id == null ? <span className="smaller">{promise.recipient.verifiedAccounts[0].handle}</span>:<Link to={"/feed/"+encode(promise.recipient.id.substring(1, promise.recipient.id.length-8))} className="oldLink">{promise.recipient.commonName==null ? promise.recipient.id.substring(0, 8)+'...':<span>{promise.recipient.commonName.name==null ? promise.recipient.id.substring(0, 8)+'...':promise.recipient.commonName.name}</span>}</Link>}</strong></h1></td>
                        </tr>
                        </tbody>
                    </table>
                    {!props.isStub ?
                    <span>
                        <p className="largeP">Status: {!promise.isLatest ? <span className="red">(nonce out-of-date)</span>:<span>{promise.nonce==0 ? <span className="yellow">(pending claim)</span>:<span>{Number(promise.vestDate)-now()>0 ? <span className="green">(vesting)</span>:<span className="green">(vested)</span>}</span>}</span>}</p>
                        {Number(promise.vestDate)-now()>0 && promise.isLatest ? <p className="largeP">Due Date: {(new Date(promise.vestDate*1000)).toLocaleString()}</p>:<p>{isMyAsset && promise.isLatest ? <button className="mini" onClick={handleClaimPromise}>claim!</button>:<span></span>}</p>}
                        {promise.isLatest ? <p className="largeP">From Account Balance: {reservesAmt>=promise.amount ? <span className="green">${reservesAmt.toFixed(2)}</span>:<span className="red">${reservesAmt.toFixed(2)}</span>}</p>:<p></p>}
                        {promise.claim.data != null && promise.isLatest ? <p className="largeP">Risk of Default: <span>{reservesAmt < promise.amount ? <span className="red">high</span>:<span className="green">low</span>}</span></p>:<p></p>}
                        <p className="largeP">Nonce: {promise.nonce}</p>
                        {seeDetails ?
                        <span>
                            <br></br>
                            <p>Author ID: {promise.author.id}</p>
                            <p>Sequence #: {promise.sequence}</p>
                            <p>Message ID: {promise.id}</p>
                            <p>Message Timestamp: {promise.timestamp}</p>
                            <p>Claim Name: {promise.claimName}</p>
                            <p>Recipient ID: {promise.recipient.id != null ? promise.recipient.id:'(unknown)'}</p>
                            <p>Author Account: {promise.author.reserves.address}</p>
                            <p>Recipient Account: {promise.recipient.reserves != null ? promise.recipient.reserves.address:'(unknown)'}</p>
                            <p>Author Account Sig: {promise.claim.data != null ? <span>{fromSigVerified ? <span className="green">verified</span>:<span>{promise.claim.fromSignature!=null ? <span className="red">invalid</span>:<span className="grey">no sig</span>}</span>}</span>:<span className="grey">no claim</span>}</p>
                            <p>Recipient Account Sig: {promise.claim.data != null ? <span>{toSigVerified ? <span className="green">verified</span>:<span>{promise.claim.toSignature!=null ? <span className="red">invalid</span>:<span className="grey">no sig</span>}</span>}</span>:<span className="grey">no claim</span>}</p>
                            <br></br>
                            {promise.claim.data != null ? <p className="center">claim data <button className="mini" onClick={handleSwitchJSON}>{isJSON ? <span>see hex</span>:<span>see JSON</span>}</button><br></br><br></br><textarea rows="10" cols="65" value={(isJSON) ? getClaim(promise.claim.data): promise.claim.data}></textarea></p>:<p></p>}
                        </span>
                        :
                        <p></p>
                        }
                        <p className="center">{seeDetails ? <button className="mini" onClick={handleHideDetails}>see less</button>:<button className="mini" onClick={handleSeeDetails}>see more</button>}</p>
                    </span>
                    :
                    <span>
                        <table className= "blobTable leftAlign">
                            <col className="width60"></col>
                            <col className="width40"></col>
                            <tr>
                                <td>{Number(promise.vestDate)-now()>0 && promise.isLatest ? <p className="largeP">Due Date: {(new Date(promise.vestDate*1000)).toLocaleString()}</p>:<p></p>}</td>
                                <td><p className="rightAlign largeP"><Link to={"/promise/"+encode(promise.author.id.substring(1, promise.author.id.length-8))+"/"+promise.claimName} className="oldLink">see claim</Link></p></td>
                            </tr>
                        </table>
                    </span>
                    }
                </div>
            </div>
            :
            <div className="blobOuter center"><p className="center">loading...</p></div>
            }
        </div>
    );
}

export default TransactionBlob;