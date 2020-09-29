import './tx.css';
import React, { useState } from 'react';

const now = () => {
    return Math.floor(Date.now() / 1000);
}

function TransactionBlob(props) {

    const [seeDetails, setSeeDetails] = useState(false);

    const handleSeeDetails = _evt => {
        setSeeDetails(true);
    }

    const handleHideDetails = _evt => {
        setSeeDetails(false);
    }

    return (
        <div className="blobOuter center">
            <div>
                <table className= "blobTable"> 
                    <thead>    
                    <tr>
                        <th><p>Amount Due:  ${props.amount.toFixed(2)}</p></th>
                        <th>{Number(props.vestDate) - now() > 0 ? <p>Vest: In {((Number(props.vestDate)-now())/86400).toFixed(1)} days</p>: <p>vested! <button className="mini">claim money</button></p>}</th>
                        <th>{seeDetails ? <button className="mini" onClick={handleHideDetails}>hide details</button>:<button className="mini" onClick={handleSeeDetails}>see details</button>}</th>
                    </tr>
                    </thead>
                </table>
                {seeDetails ?
                    <table className= "blobTable leftAlign">
                        <col className="width70"></col>
                        <col className="width30"></col>
                        <tbody>
                        <tr>
                            <td><p><span className="smaller">{props.author.reserves.address}</span> {'-->'} <span className="smaller">{props.recipient.reserves.address}</span><span></span></p></td>
                            <td><p>Amount in Reserve: {props.reservesAmt < props.amount ? <span className="red">${props.reservesAmt.toFixed(2)}</span>:<span className="green">${props.reservesAmt.toFixed(2)}</span>}</p></td>
                        </tr>
                        <tr>
                            <td><p><span className="smaller">{props.author.id}</span> {'-->'} <span className="smaller">{props.recipient.id}</span></p></td>
                            <td><p>claim sig: {props.isVerified ? <span className="green">verified</span>:<span className="grey">not verified</span>}</p></td>
                        </tr>
                        <tr>
                            <td><p>{props.author.commonName==null ? '(unknown)':props.author.commonName.name} {'-->'} {props.recipient.commonName==null ? '(unknown)':props.recipient.commonName.name}</p></td>
                            <td><p>risk of default: {props.reservesAmt < props.amount ? <span className="red">high</span>:<span className="green">low</span>}</p></td>
                        </tr>
                        </tbody>
                    </table>
                    :
                    <p></p>
                }
            </div>
        </div>
    );
}

export default TransactionBlob;