import './tx.css';
import React, { useState } from 'react';
import * as cashless from 'containers/App/cashless';
import * as ethers from 'ethers';

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

function TransactionBlob(props) {

    const [seeDetails, setSeeDetails] = useState(false);
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

    return (
        <div className="blobOuter center">
            <div>
                <table className= "blobTable">
                    <col className="width50"></col>
                    <col className="width25"></col>
                    <col className="width25"></col>
                    <thead>    
                    <tr>
                        <td><p>To: {props.recipient.id == null ? props.recipient.verifiedAccounts[0].handle:<span className="smaller">{props.recipient.id}</span>}</p></td>
                        <td><p>Amount Due:  ${props.amount.toFixed(2)}</p></td>
                        <td>{Number(props.vestDate) - now() > 0 ? <p>Vest: {((Number(props.vestDate)-now())/86400).toFixed(1)} days</p>: <p>vested</p>}</td>
                    </tr>
                    <tr>
                        <td><p>From: <span className="smaller">{props.author.id}</span></p></td>
                        <td><p>risk of default: {(props.reservesAmt < props.amount) ? <span className="red">high</span>:<span className="green">low</span>}</p></td>
                        <td>{((Number(props.vestDate) - now() < 0) && props.isMyAsset) ? <p><button className="mini">claim</button></p>:<span></span>}</td>
                    </tr>
                    </thead>
                </table>
                {seeDetails ?
                <span>
                    <br></br><br></br>
                    <table className= "blobTable leftAlign">
                        <col className="width50"></col>
                        <col className="width50"></col>
                        <tbody>
                        <tr>
                            <td><p>Sender ID: {props.author.id.substring(0, 16)+'...'}</p></td>
                            <td><p>Receiver ID: {props.recipient.id==null ? '(unknown)': <span>{props.recipient.id.substring(0, 25)+'...'}</span>}</p></td>
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
                            <td><p>Claim: {props.isVerified ? <span className="green">verified</span>:<span className="grey">not verified</span>}</p></td>
                            <td><p></p></td>
                        </tr>
                        <tr>
                            <td><p>In Reserve: {props.reservesAmt < props.amount ? <span className="red">${props.reservesAmt.toFixed(2)}</span>:<span className="green">${props.reservesAmt.toFixed(2)}</span>}</p></td>
                            <td><p></p></td>
                        </tr>
                        </tbody>
                    </table>
                    <p>claim data <button className="mini" onClick={handleSwitchJSON}>{isJSON ? <span>see hex</span>:<span>see JSON</span>}</button><br></br><br></br><textarea rows="10" cols="65" value={(isJSON && props.claimData != null) ? getClaim(props.claimData): props.claimData}></textarea></p>
                </span>
                :
                <p></p>
                }
                <p>{seeDetails ? <button className="mini" onClick={handleHideDetails}>hide details</button>:<button className="mini" onClick={handleSeeDetails}>see details</button>}</p>
            </div>
        </div>
    );
}

export default TransactionBlob;