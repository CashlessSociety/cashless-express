const ethers = require('ethers');
const crypto = require('crypto');
const ethjsutil = require('ethereumjs-util');
const abi = require('ethereumjs-abi');

const ecsign = ethjsutil.ecsign;

cashlessContractABI = () => { 
    return [{"inputs": [{"internalType": "bytes32", "name": "salt", "type": "bytes32"}, {"internalType": "address", "name": "_tokenAddress", "type": "address"}], "stateMutability": "nonpayable", "type": "constructor"}, {"stateMutability": "nonpayable", "type": "fallback"}, {"inputs": [], "name": "DOMAIN_SEPARATOR", "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}], "name": "loops", "outputs": [{"internalType": "bytes32", "name": "proposalName", "type": "bytes32"}, {"internalType": "uint256", "name": "minFlow", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [], "name": "minVestDuration", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "reserves", "outputs": [{"internalType": "uint256", "name": "balance", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [], "name": "tokenAddress", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "address", "name": "accountOwner", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "fundReserves", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}, {"internalType": "address", "name": "targetReceiver", "type": "address"}], "name": "withdrawReserves", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "bytes", "name": "claimData", "type": "bytes"}, {"internalType": "uint8[2]", "name": "sigsV", "type": "uint8[2]"}, {"internalType": "bytes32[2]", "name": "sigsR", "type": "bytes32[2]"}, {"internalType": "bytes32[2]", "name": "sigsS", "type": "bytes32[2]"}], "name": "proposeSettlement", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "bytes", "name": "claimData", "type": "bytes"}, {"internalType": "uint8[2]", "name": "sigsV", "type": "uint8[2]"}, {"internalType": "bytes32[2]", "name": "sigsR", "type": "bytes32[2]"}, {"internalType": "bytes32[2]", "name": "sigsS", "type": "bytes32[2]"}], "name": "disputeSettlement", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "address", "name": "accountOwner", "type": "address"}, {"internalType": "bytes32", "name": "claimID", "type": "bytes32"}], "name": "redeemClaim", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "bytes32", "name": "proposalName", "type": "bytes32"}, {"internalType": "address[]", "name": "loop", "type": "address[]"}, {"internalType": "uint256", "name": "minFlow", "type": "uint256"}], "name": "proposeLoop", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "bytes32", "name": "loopID", "type": "bytes32"}, {"internalType": "bytes", "name": "encodedPriorClaim", "type": "bytes"}, {"internalType": "bytes", "name": "encodedClaim", "type": "bytes"}], "name": "commitLoopClaim", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "bytes", "name": "claimData", "type": "bytes"}, {"internalType": "uint8", "name": "v", "type": "uint8"}, {"internalType": "bytes32", "name": "r", "type": "bytes32"}, {"internalType": "bytes32", "name": "s", "type": "bytes32"}, {"internalType": "bool", "name": "isOwner", "type": "bool"}], "name": "verifyClaimSig", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "address", "name": "accountOwner", "type": "address"}], "name": "getClaimIDs", "outputs": [{"internalType": "bytes32[]", "name": "", "type": "bytes32[]"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "address", "name": "accountOwner", "type": "address"}, {"internalType": "bytes32", "name": "claimID", "type": "bytes32"}, {"internalType": "uint256", "name": "index", "type": "uint256"}], "name": "getReservesClaim", "outputs": [{"internalType": "bytes", "name": "", "type": "bytes"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "address", "name": "accountOwner", "type": "address"}, {"internalType": "bytes32", "name": "claimID", "type": "bytes32"}], "name": "getReservesSettlement", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "bytes32", "name": "loopID", "type": "bytes32"}], "name": "getLoopStatus", "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}, {"internalType": "address[]", "name": "", "type": "address[]"}], "stateMutability": "view", "type": "function"}];
}

cashlessLibContractABI = () => {
    return [{"inputs": [], "stateMutability": "nonpayable", "type": "constructor"}, {"stateMutability": "nonpayable", "type": "fallback"}, {"inputs": [{"internalType": "bytes", "name": "data", "type": "bytes"}, {"internalType": "bytes32", "name": "domainSeparator", "type": "bytes32"}], "name": "hashClaimData", "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}], "stateMutability": "pure", "type": "function"}, {"inputs": [{"internalType": "bytes32", "name": "claimName", "type": "bytes32"}, {"internalType": "address", "name": "sender", "type": "address"}, {"internalType": "address", "name": "receiver", "type": "address"}], "name": "getClaimID", "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}], "stateMutability": "pure", "type": "function"}, {"inputs": [{"internalType": "bytes32", "name": "proposalName", "type": "bytes32"}, {"internalType": "address[]", "name": "loop", "type": "address[]"}], "name": "getLoopID", "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}], "stateMutability": "pure", "type": "function"}, {"inputs": [{"internalType": "bytes", "name": "a", "type": "bytes"}, {"internalType": "uint8[2]", "name": "b", "type": "uint8[2]"}, {"internalType": "bytes32[2]", "name": "c", "type": "bytes32[2]"}, {"internalType": "bytes32[2]", "name": "d", "type": "bytes32[2]"}], "name": "encodeLoopClaim", "outputs": [{"internalType": "bytes", "name": "", "type": "bytes"}], "stateMutability": "pure", "type": "function"}, {"inputs": [{"internalType": "bytes32", "name": "hash", "type": "bytes32"}, {"internalType": "uint8", "name": "v", "type": "uint8"}, {"internalType": "bytes32", "name": "r", "type": "bytes32"}, {"internalType": "bytes32", "name": "s", "type": "bytes32"}, {"internalType": "address", "name": "signer", "type": "address"}], "name": "verifySignature", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "pure", "type": "function"}];
}

erc20ContractABI = () => {
    return [{"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "owner", "type": "address"}, {"indexed": true, "internalType": "address", "name": "spender", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}], "name": "Approval", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "from", "type": "address"}, {"indexed": true, "internalType": "address", "name": "to", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}], "name": "Transfer", "type": "event"}, {"inputs": [], "name": "totalSupply", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "address", "name": "account", "type": "address"}], "name": "balanceOf", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "address", "name": "recipient", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "transfer", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "address", "name": "spender", "type": "address"}], "name": "allowance", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "approve", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "address", "name": "sender", "type": "address"}, {"internalType": "address", "name": "recipient", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "transferFrom", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "nonpayable", "type": "function"}];
}

cashlessAddress = network => {
	if (network == "mainnet") {
		return "";
	}
	if (network == "rinkeby") {
		return "0x61319564Ac5e04E6462A5ccbc68c812450133E06";
	}
	if (network == "dev") {
		return "0x20346Aebaacfa94B8dcd7F5cE3B7f25d3163C672";
	}
	console.log("error: unrecognized network:", network);
}

cashlessLibAddress = network => {
	if (network == "mainnet") {
		return "";
	}
	if (network == "rinkeby") {
		return "0xf7DCB21902deA7e2e6AD2E8842E9A01030c1aCF9";
	}
	if (network == "dev") {
		return "0xb3869548879977C80564f0a42FF934F0cEf4BBC7";
	}
	console.log("error: unrecognized network:", network);
}

erc20Address = network => {
    if (network == "mainnet") {
        return "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    }
    if (network == "rinkeby") {
        return "0xDDcD99957A7992B7e4D32f3Ea662616a6702807E";
    }
    if (network == "dev") {
        return "0xd4177A2Bd990DA8416f30C1D9A161CB2c9325F8b";
    }
	console.log("error: unrecognized network:", network);
}

networkFromProviderURL = providerURL => {
	if (providerURL.includes("infura")) {
		return providerURL.substring(8, 15);
	} else {
		return "dev";
	}
}

exports.contract = (providerURL, privateKey) => {
	let provider = new ethers.providers.JsonRpcProvider(providerURL);
	let contractABI = cashlessContractABI();
	let contractAddress = cashlessAddress(networkFromProviderURL(providerURL));
	let contract = new ethers.Contract(contractAddress, contractABI, provider);
	if (privateKey != null) {
		let wallet = new ethers.Wallet(privateKey, provider);
		contract = contract.connect(wallet);
	}

	return contract;
}

exports.erc20Contract = (providerURL, privateKey) => {
	let provider = new ethers.providers.JsonRpcProvider(providerURL);
    let contractABI = erc20ContractABI();
    let contractAddress = erc20Address(networkFromProviderURL(providerURL));
	let contract = new ethers.Contract(contractAddress, contractABI, provider);
	if (privateKey != null) {
		let wallet = new ethers.Wallet(privateKey, provider);
		contract = contract.connect(wallet);
	}

	return contract;
}

exports.libContract = (providerURL) => {
	let provider = new ethers.providers.JsonRpcProvider(providerURL);
	let contractABI = cashlessLibContractABI();
	let contractAddress = cashlessLibAddress(networkFromProviderURL(providerURL));
	let contract = new ethers.Contract(contractAddress, contractABI, provider);

	return contract;
}

exports.addressFromPriv = privateKey => {
	let wallet = new ethers.Wallet(privateKey);
	return wallet.address;
}

exports.encodeClaim = (amount, disputeDuration, vestTimestamp, voidTimestamp, senderAddress, receiverAddress, claimName, loopID, nonce) => {
	return abi.rawEncode(["uint256[4]", "address[2]", "bytes32[2]", "uint8"], [[ethers.utils.parseEther(amount).toString(), disputeDuration, vestTimestamp, voidTimestamp], [senderAddress, receiverAddress], [claimName, loopID], nonce]);
}

exports.decodeClaim = (claimData) => {
	return abi.rawDecode(["uint256[4]", "address[2]", "bytes32[2]", "uint8"], claimData);
}

exports.encodeLoopClaim = async (cashlessLib, claimData, sig1, sig2) => {
	try {
		let data = await cashlessLib.encodeLoopClaim(claimData, [sig1.v, sig2.v], [sig1.r, sig2.r], [sig1.s, sig2.s]);
		return data;
	} catch(e) {
		console.log("error encoding loop claim:", e.message);
		return
	}
}

exports.getLoopID = async (cashlessLib, loopName, addresses) => {
	try {
		let data = await cashlessLib.functions.getLoopID(loopName, addresses);
		return data[0];
	} catch(e) {
		console.log("error encoding loop ID:", e.message);
		return
	} 
}

exports.getClaimID = async (cashlessLib, claimName, senderAddress, receiverAddress) => {
	try {
		let data = await cashlessLib.functions.getClaimID(claimName, senderAddress, receiverAddress);
		return data[0];
	} catch(e) {
		console.log("error encoding claim ID:", e.message);
		return
	} 
}

exports.signClaim = async (cashless, cashlessLib, claimData) => {
	try {
		let privateKey = cashless.signer.privateKey;
		let ds = await cashless.functions.DOMAIN_SEPARATOR();
		ds = ds[0];
		let h = await cashlessLib.functions.hashClaimData(claimData, ds);
		h = h[0].substring(2);
		let bh = Uint8Array.from(Buffer.from(h, 'hex'));
		let priv = Uint8Array.from(Buffer.from(privateKey.substring(2), 'hex'));
		return ecsign(bh, priv);		
	} catch(e) {
		console.log("error signing claim:", e.message);
		return
	}
}

exports.getReserves = async (cashless, address) => {
	try {
		return await cashless.functions.reserves(address);
	} catch(e) {
		console.log("error getting reserves:", e.message);
		return
	}
}

exports.verifyClaimSig = async (cashless, claimData, sig, isSender) => {
	try {
		let r = await cashless.functions.verifyClaimSig(claimData, sig.v, sig.r, sig.s, isSender);
		return r[0];
	} catch(e) {
		console.log("error verifying claim sig:", e.message);
		return
	}
}

exports.erc20TransferTx = async (erc20, receiverAddress, amount) => {
    let options = {gasLimit: 60000};
    let value = ethers.utils.parseEther(amount);
	try {
        let tx = await erc20.functions.transfer(receiverAddress, value, options);
        console.log("erc20 transfer tx hash:", tx.hash);
        return tx.hash;
	} catch(e) {
		console.log("error encoding claim ID:", e.message);
		return
	} 
}

exports.fundReservesTx = async (cashless, erc20, amount) => {
    if (cashless.signer.address != erc20.signer.address) {
        console.log('mismatching signers in fund tx');
        return
    }
    let value = ethers.utils.parseEther(amount);
	let options = {gasLimit: 100000};
	try {
		let tx1 = await erc20.functions.approve(cashless.address, value, options);
		console.log("approve tx hash:", tx1.hash);
	} catch(e) {
		console.log('error funding reserves:', e.message);
		return
	}
	try {
		let tx = await cashless.functions.fundReserves(cashless.signer.address, value, options);
		console.log("fund tx hash:", tx.hash);
		return tx.hash;
	} catch(e) {
		console.log('error funding reserves:', e.message);
		return
	}
}

exports.withdrawReservesTx = async (cashless, amount, receiverAddress) => {
	let options = {gasLimit: 100000};
	try {
		let tx = await cashless.functions.withdrawReserves(ethers.utils.parseEther(amount), receiverAddress, options);
		console.log("withdraw tx hash:", tx.hash);
		return tx.hash;
	} catch(e) {
		console.log('error withdrawing reserves:', e.message);
		return
	}
}

exports.proposeSettlementTx = async (cashless, claimData, sig1, sig2) => {
	let options = {gasLimit: 800000};
	try{
		let tx = await cashless.functions.proposeSettlement(claimData, [sig1.v, sig2.v], [sig1.r, sig2.r], [sig1.s, sig2.s], options);
		console.log("settlement tx hash:", tx.hash);
		return tx.hash;
	} catch(e) {
		console.log("error proposing settlement:", e.message);
		return
	}
}

exports.disputeSettlementTx = async (cashless, claimData, sig1, sig2) => {
	let options = {gasLimit: 800000};
	try{
		let tx = await cashless.functions.disputeSettlement(claimData, [sig1.v, sig2.v], [sig1.r, sig2.r], [sig1.s, sig2.s], options);
		console.log("dispute settlement tx hash:", tx.hash);
		return tx.hash;
	} catch(e) {
		console.log("error disputing settlement:", e.message);
		return
	}
}

exports.closeSettlementTx = async (cashless, claimingAddress, claimID) => {
	let options = {gasLimit: 800000};
	try {
		var tx = await cashless.functions.redeemClaim(claimingAddress, claimID, options);
		console.log("close settlement tx hash:", tx.hash);
		return tx.hash;
	} catch(e) {
		console.log("error closing settlement:", e.message);
		return
	}	
}

exports.proposeLoopTx = async (cashless, loopName, addresses, minFlowEth) => {
	let options = {gasLimit: 1000000};
	try {
		let tx = await cashless.functions.proposeLoop(loopName, addresses, ethers.utils.parseEther(minFlowEth), options);
		console.log("loop proposal tx hash:", tx.hash);
		return tx.hash;
	} catch(e) {
		console.log("error proposing loop:", e.message);
		return		
	}
}

exports.commitLoopClaimTx = async (cashless, loopID, encodedClaim1, encodedClaim2) => {
	let options = {gasLimit: 1000000};
	try {
		let tx = await cashless.functions.commitLoopClaim(loopID, encodedClaim1, encodedClaim2, options);
		console.log("commit loop claim tx hash:", tx.hash);
		return tx.hash;
	} catch(e) {
		console.log("error committing loop claim:", e.message);
		return
	}
}

exports.hashString = str => {
	let hash = crypto.createHash('sha256');
	hash.update(str);
	return hash.digest();
}