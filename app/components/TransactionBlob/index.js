import './tx.css';
import React, { useState } from 'react';
import { encode } from 'url-safe-base64';
import * as cashless from 'containers/App/cashless';
import * as ethers from 'ethers';
import { useKeyFileStickyState, safeKey } from 'utils/stateUtils';
import { Link } from 'react-router-dom';

const toEth = (num) => {
    return num/ethers.utils.parseEther("1");
}

const now = () => {
    return Math.floor(Date.now() / 1000);
}

const getClaim = (claimString) => {
    let data = Uint8Array.from(Buffer.from(claimString.substring(2), 'hex'));
    let claim = cashless.decodeClaim(data);
    let readableClaim = {amount: toEth(claim[0][0]), disputeDuration: Number(claim[0][1]), vestTimestamp: Number(claim[0][2]), voidTimestamp: Number(claim[0][3]), senderAddress: "0x"+claim[1][0], receiverAddress: "0x"+claim[1][1], claimName: cashless.bufferToHex(claim[2][0]), loopID: cashless.bufferToHex(claim[2][1]), nonce: Number(claim[3])};
    return JSON.stringify(readableClaim, null, 4);
}

const getAccountsString = (accounts) => {
    let s = "";
    if (accounts==null || accounts.length == 0) {
        return '(none)';
    }
    for (let i=0; i< accounts.length; i++) {
        s += accounts[i].handle + ", ";
    }
    return s.substring(0, s.length-2);
}

const providerURL = "https://"+cashless.network+".infura.io/v3/"+cashless.infuraAPIKey;

function TransactionBlob(props) {

    const [seeDetails, setSeeDetails] = useState(false);
    const [key, setKey] = useKeyFileStickyState();
    const [isJSON, setIsJSON] = useState(false);

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
        let data = Uint8Array.from(Buffer.from(props.claimData.substring(2), 'hex'));
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
        let senderSig = {v: props.fromSignature.v, r: Uint8Array.from(Buffer.from(props.fromSignature.r.substring(2), 'hex')), s: Uint8Array.from(Buffer.from(props.fromSignature.s.substring(2), 'hex'))};
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

    return (
        <div className={props.isLatest ? "blobOuter center": "bgGrey blobOuter center"}>
            <div>
                <table className= "blobTable leftAlign">
                    <col className="width60"></col>
                    <col className="width40"></col>
                    <tbody>
                    <tr>
                        <td><h1><strong>ID:{props.claimName}</strong></h1></td>
                        <td><h1><strong>Nonce: {props.nonce==0 ? <span className="yellow">(pending)</span>:props.nonce}</strong></h1></td>
                    </tr>
                    </tbody>
                </table>
                <p className="largeP">Amount:  ${props.amount.toFixed(2)}</p>
                <p className="largeP">To: {props.recipient.id == null ? props.recipient.verifiedAccounts[0].handle:<Link to={"/feed/"+encode(props.recipient.id.substring(1, props.recipient.id.length-8))} className="oldLink">{props.recipient.commonName==null ? props.recipient.id.substring(0, 8)+'...':<span>{props.recipient.commonName.name==null ? props.recipient.id.substring(0, 8)+'...':props.recipient.commonName.name}</span>}</Link>}</p>
                <p className="largeP">From: <Link to={"/feed/"+encode(props.author.id.substring(1, props.author.id.length-8))} className="oldLink">{props.author.commonName == null ? props.author.id.substring(0, 10)+'...': props.author.commonName.name}</Link></p>
                {props.isLatest ? <p className="largeP">Risk of Default: {props.claimData != null ? <span>{(props.reservesAmt < props.amount) ? <span className="red">high</span>:<span className="green">low</span>}</span>: <span className="grey">none</span>}</p>: <p className="largeP"></p>}
                {props.isLatest ? <p className="largeP">Due Date: {Number(props.vestDate) - now() > 0 ? <span>{(new Date(props.vestDate*1000)).toLocaleString()}</span>:<span className="green">Available Now</span>} {props.nonce==0 ? <span className="yellow">(pending)</span>:<span></span>}</p>: <p className="largeP"></p>}
                <span>{(props.isMyAsset) && (Number(props.vestDate) - now() < 0) && (props.isLatest) ? <p><button className="mini" onClick={handleClaimPromise}>claim!</button></p>:<p></p>}</span>
                {seeDetails ?
                <span>
                    <br></br>
                    <table className= "blobTable leftAlign">
                        <col className="width50"></col>
                        <col className="width50"></col>
                        <tbody>
                        <tr>
                            <td><p>Sender</p></td>
                            <td><p>Receiver</p></td>
                        </tr>
                        <tr>
                            <td><p>ID: <span className="smaller"><Link to={"/feed/"+encode(props.author.id.substring(1, props.author.id.length-8))} className="oldLink">{props.author.id}</Link></span></p></td>
                            <td><p>ID: {props.recipient.id==null ? '(unknown)': <span className="smaller"><Link to={"/feed/"+encode(props.recipient.id.substring(1, props.recipient.id.length-8))} className="oldLink">{props.recipient.id}</Link></span>}</p></td>
                        </tr>
                        <tr>
                            <td><p>Name: {props.author.commonName==null ? '(unknown)':props.author.commonName.name}</p></td>
                            <td><p>Name:  {props.recipient.commonName==null ? '(unknown)':props.recipient.commonName.name}</p></td>
                        </tr>
                        <tr>
                            <td><p>Address: <span className="smaller">{props.author.reserves.address}</span></p></td>
                            <td><p>Address: {props.recipient.reserves == null ? '(unknown)':<span className="smaller">{props.recipient.reserves.address}</span>}</p></td>
                        </tr>
                        <tr>
                            <td><p>Accounts: {getAccountsString(props.author.verifiedAccounts)}</p></td>
                            <td><p>Accounts: {getAccountsString(props.recipient.verifiedAccounts)}</p></td>
                        </tr>
                        <tr>
                            <td><p>Signature: {props.claimData != null ? <span>{props.fromVerified ? <span className="green">verified</span>:<span className="grey">unverified</span>}</span>:<span className="grey">no claim</span>}</p></td>
                            <td><p>Signature: {props.claimData != null ? <span>{props.toVerified ? <span className="green">verified</span>:<span className="grey">unverified</span>}</span>:<span className="grey">no claim</span>}</p></td>
                        </tr>
                        <tr>
                            <td><p>In Reserve: {props.reservesAmt < props.amount ? <span className="red">${props.reservesAmt.toFixed(2)}</span>:<span className="green">${props.reservesAmt.toFixed(2)}</span>}</p></td>
                            <td><p></p></td>
                        </tr>
                        </tbody>
                    </table>
                    <p className="center">claim data <button className="mini" onClick={handleSwitchJSON}>{isJSON ? <span>see hex</span>:<span>see JSON</span>}</button><br></br><br></br><textarea rows="10" cols="65" value={(isJSON && props.claimData != null) ? getClaim(props.claimData): props.claimData}></textarea></p>
                </span>
                :
                <p></p>
                }
                <p className="center">{seeDetails ? <button className="mini" onClick={handleHideDetails}>see less</button>:<button className="mini" onClick={handleSeeDetails}>see more</button>}</p>
            </div>
        </div>
    );
}

export default TransactionBlob;