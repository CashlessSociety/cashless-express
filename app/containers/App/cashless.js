const ethers = require('ethers');
const crypto = require('crypto');
const ethjsutil = require('ethereumjs-util');
const abi = require('ethereumjs-abi');

const ecsign = ethjsutil.ecsign;

cashlessContractABI = () => { 
	return [{"inputs":[{"internalType":"bytes32","name":"salt","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":false,"stateMutability":"nonpayable","type":"fallback"},{"constant":true,"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"aliases","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"flatWithdrawFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"loops","outputs":[{"internalType":"bytes32","name":"proposalName","type":"bytes32"},{"internalType":"uint256","name":"minFlow","type":"uint256"},{"internalType":"uint256","name":"lockTimestamp","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"minVestDuration","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"networkAdmin","outputs":[{"internalType":"addresspayable","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"pendingAliases","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"percentWithdrawFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"reserves","outputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"grossClaimed","type":"uint256"},{"internalType":"uint256","name":"grossDefaulted","type":"uint256"},{"internalType":"uint256","name":"grossPaid","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"reservesAddress","type":"address"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"createReserves","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"accountOwner","type":"address"}],"name":"fundReserves","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"addresspayable","name":"targetReceiver","type":"address"},{"internalType":"uint256","name":"fee","type":"uint256"}],"name":"withdrawReserves","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"bytes32","name":"newAlias","type":"bytes32"}],"name":"addAlias","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"bytes32","name":"existingAlias","type":"bytes32"}],"name":"deleteAlias","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"bytes32","name":"newAlias","type":"bytes32"}],"name":"addPendingAlias","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"bytes32","name":"newAlias","type":"bytes32"},{"internalType":"address","name":"addr","type":"address"}],"name":"commitPendingAlias","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"bytes","name":"claimData","type":"bytes"},{"internalType":"uint8[2]","name":"sigsV","type":"uint8[2]"},{"internalType":"bytes32[2]","name":"sigsR","type":"bytes32[2]"},{"internalType":"bytes32[2]","name":"sigsS","type":"bytes32[2]"}],"name":"proposeSettlement","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"bytes","name":"claimData","type":"bytes"},{"internalType":"uint8[2]","name":"sigsV","type":"uint8[2]"},{"internalType":"bytes32[2]","name":"sigsR","type":"bytes32[2]"},{"internalType":"bytes32[2]","name":"sigsS","type":"bytes32[2]"}],"name":"disputeSettlement","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"accountOwner","type":"address"},{"internalType":"bytes32","name":"claimID","type":"bytes32"}],"name":"redeemClaim","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"bytes32","name":"proposalName","type":"bytes32"},{"internalType":"address[]","name":"loop","type":"address[]"},{"internalType":"uint256","name":"minFlow","type":"uint256"},{"internalType":"uint256","name":"lockTimestamp","type":"uint256"}],"name":"proposeLoop","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"bytes32","name":"loopID","type":"bytes32"},{"internalType":"bytes","name":"encodedPriorClaim","type":"bytes"},{"internalType":"bytes","name":"encodedClaim","type":"bytes"}],"name":"commitLoopClaim","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"bytes","name":"claimData","type":"bytes"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"},{"internalType":"bool","name":"isOwner","type":"bool"}],"name":"verifyClaimSig","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"accountOwner","type":"address"},{"internalType":"bytes32","name":"claimID","type":"bytes32"}],"name":"getAdjustedClaimAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"accountOwner","type":"address"}],"name":"getClaimIDs","outputs":[{"internalType":"bytes32[]","name":"","type":"bytes32[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"accountOwner","type":"address"},{"internalType":"bytes32","name":"claimID","type":"bytes32"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getReservesClaim","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"accountOwner","type":"address"},{"internalType":"bytes32","name":"claimID","type":"bytes32"}],"name":"getReservesSettlement","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"bytes32","name":"loopID","type":"bytes32"}],"name":"getLoopStatus","outputs":[{"internalType":"address[]","name":"","type":"address[]"},{"internalType":"address[]","name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"}]; 
}

cashlessLibContractABI = () => {
	return [{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":false,"stateMutability":"nonpayable","type":"fallback"},{"constant":true,"inputs":[{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes32","name":"domainSeparator","type":"bytes32"}],"name":"hashClaimData","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"internalType":"bytes32","name":"claimName","type":"bytes32"},{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"bytes32","name":"receiverAlias","type":"bytes32"}],"name":"getClaimID","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"internalType":"bytes32","name":"proposalName","type":"bytes32"},{"internalType":"address[]","name":"loop","type":"address[]"}],"name":"getLoopID","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"internalType":"bytes","name":"a","type":"bytes"},{"internalType":"uint8[2]","name":"b","type":"uint8[2]"},{"internalType":"bytes32[2]","name":"c","type":"bytes32[2]"},{"internalType":"bytes32[2]","name":"d","type":"bytes32[2]"}],"name":"encodeLoopClaim","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"payable":false,"stateMutability":"pure","type":"function"}];
}

cashlessAddress = network => {
	if (network == "mainnet") {
		return "0x9c30cC03246443D6c9e211c298bBd94Ef889151E";
	}
	if (network == "ropsten") {
		return "0xee0Ef6Bc446c4756E5164Ac6659F4c6D07A2A7BF";
	}
	if (network == "dev") {
		return "0xd4177a2bd990da8416f30c1d9a161cb2c9325f8b";
	}
	console.log("error: unrecognized network:", network);
}

cashlessLibAddress = network => {
	if (network == "mainnet") {
		return "0xa3c93Ea516d2c9f39901f7C4379b3b3a4B281aB8";
	}
	if (network == "ropsten") {
		return "0x10E27c27ba5c5f7c25f5BD24dB9c27Da3390dA85";
	}
	if (network == "dev") {
		return "0xb3869548879977c80564f0a42ff934f0cef4bbc7";
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
	let contractABI = cashlessContractABI()
	let contractAddress = cashlessAddress(networkFromProviderURL(providerURL))
	let contract = new ethers.Contract(contractAddress, contractABI, provider);
	if (privateKey != null) {
		let wallet = new ethers.Wallet(privateKey, provider);
		contract = contract.connect(wallet);
	}

	return contract;
}

exports.libContract = (providerURL) => {
	let provider = new ethers.providers.JsonRpcProvider(providerURL);
	let contractABI = cashlessLibContractABI()
	let contractAddress = cashlessLibAddress(networkFromProviderURL(providerURL))
	let contract = new ethers.Contract(contractAddress, contractABI, provider)

	return contract;
}

exports.addressFromPriv = privateKey => {
	let wallet = new ethers.Wallet(privateKey);
	return wallet.address;
}

exports.encodeClaim = (amountEth, disputeDuration, vestTimestamp, voidTimestamp, senderAddress, receiverAddress, claimName, receiverAlias, loopID, nonce) => {
	return abi.rawEncode(["uint256[4]", "address[2]", "bytes32[3]", "uint8"], [[ethers.utils.parseEther(amountEth).toString(), disputeDuration, vestTimestamp, voidTimestamp], [senderAddress, receiverAddress], [claimName, receiverAlias, loopID], nonce]);
}

exports.decodeClaim = (claimData) => {
	return abi.rawDecode(["uint256[4]", "address[2]", "bytes32[3]", "uint8"], claimData);
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

exports.getClaimID = async (cashlessLib, claimName, senderAddress, receiverAddress, recvAlias) => {
	try {
		let data = await cashlessLib.functions.getClaimID(claimName, senderAddress, receiverAddress, recvAlias);
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

exports.signInitReserves = async (cashless, cashlessLib) => {
	try {
		let privateKey = cashless.signer.privateKey;
		let address = cashless.signer.address;
		let ds = await cashless.functions.DOMAIN_SEPARATOR();
		ds = ds[0];
		let data = abi.rawEncode(["address"], [address]);
		let h = await cashlessLib.functions.hashClaimData(data, ds);
		h = h[0].substring(2);
		let bh = Uint8Array.from(Buffer.from(h, 'hex'));
		let priv = Uint8Array.from(Buffer.from(privateKey.substring(2), 'hex'));
		return ecsign(bh, priv);
	} catch(e) {
		console.log("error signing init reserves:", e.message);
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

exports.initReservesTx = async (cashless, address, sig) => {
	let options = {gasLimit: 100000};
	try {
		let tx = await cashless.functions.createReserves(address, sig.v, sig.r, sig.s, options);
		console.log("new reserves tx hash:", tx.hash);
		return tx.hash;
	} catch(e) {
		console.log('error creating reserves:', e.message);
		return 
	}
}

exports.fundReservesTx = async (cashless, amountEth) => {
	let reservesAddress = cashless.signer.address;
	let options = {value: ethers.utils.parseEther(amountEth), gasLimit: 50000};
	try {
		let tx = await cashless.functions.fundReserves(reservesAddress, options);
		console.log("fund tx hash:", tx.hash);
		return tx.hash;
	} catch(e) {
		console.log('error funding reserves:', e.message);
		return
	}
}

exports.withdrawReservesTx = async (cashless, amountEth, receiverAddress, tipAmountEth) => {
	let options = {gasLimit: 60000};
	try {
		let tx = await cashless.functions.withdrawReserves(ethers.utils.parseEther(amountEth), receiverAddress, ethers.utils.parseEther(tipAmountEth), options);
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

exports.proposeLoopTx = async (cashless, loopName, addresses, minFlowEth, lockTime) => {
	let options = {gasLimit: 100000};
	try {
		let tx = await cashless.functions.proposeLoop(loopName, addresses, ethers.utils.parseEther(minFlowEth), lockTime, options);
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

exports.issuePendingAliasTx = async (cashless, alias) => {
	let options = {gasLimit: 100000};
	try {
		let tx = await cashless.functions.addPendingAlias(alias, options);
		console.log("pending alias tx hash:", tx.hash);
		return tx.hash;
	} catch(e) {
		console.log("error issuing pending alias:", e.message);
		return
	}
}

exports.commitPendingAliasTx = async (cashless, alias, address) => {
	let options = {gasLimit: 100000};
	try {
		let tx = await cashless.functions.commitPendingAlias(alias, address, options);
		console.log("commit pending alias tx hash:", tx.hash);
		return tx.hash;
	} catch(e) {
		console.log("error committing pending alias:", e.message);
		return
	}
}

exports.issueAliasTx = async (cashless, alias) => {
	let options = {gasLimit: 100000};
	try {
		var tx = await cashless.functions.addAlias(alias, options);
		console.log("add alias tx hash:", tx.hash);
		return tx.hash;
	} catch(e) {
		console.log("error adding alias:", e.message);
		return
	}
}

exports.deleteAliasTx = async (cashless, alias) => {
	let options = {gasLimit: 100000};
	try {
		var tx = await cashless.functions.deleteAlias(alias, options);
		console.log("delete alias tx hash:", tx.hash);
		return tx.hash;
	} catch(e) {
		console.log("error deleting alias:", e.message);
		return
	}
}

exports.hashString = str => {
	let hash = crypto.createHash('sha256');
	hash.update(str);
	return hash.digest();
}