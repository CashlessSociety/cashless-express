const { DataSource } = require('apollo-datasource');
const ssb = require("./lib/ssb-client");
const pull = require("pull-stream");

const streamPull = (...streams) =>
  new Promise((resolve, reject) => {
    pull(
      ...streams,
      pull.collect((err, msgs) => {
        if (err) return reject(err);
        return resolve(msgs);
      })
    );
});

const network = "rinkeby";
const version = 1.0;

class ssbFlumeAPI extends DataSource {
  constructor() {
    super();
    this.ssb = ssb;
    this.network = network;
    this.version = version;
  }

  initialize(config) {
    this.context = config.context;
  }

  promiseReducer(promise) {
      promise.value.content.from.reserves.type = "RESERVES";
      if (promise.value.content.from.commonName != null) {
        promise.value.content.from.commonName.type = "COMMON";
      }
      if (promise.value.content.to.reserves != null) {
        promise.value.content.to.reserves.type = "RESERVES";
      }
      if (promise.value.content.to.commonName != null) {
        promise.value.content.to.commonName.type = "COMMON";
      }
      if (promise.value.content.to.verifiedAccounts != null) {
        for (let j=0; j<promise.value.content.to.verifiedAccounts.length; j++) {
            promise.value.content.to.verifiedAccounts[j].type = "ACCOUNT";
        }
      }
      promise.value.content.to.type = "FEED";
      return {
        type: "PROMISE",
        id: promise.key,
        sequence: promise.value.sequence,
        hash: promise.value.hash.toUpperCase(),
        previous: promise.value.previous,
        signature: promise.value.signature,
        timestamp: promise.value.timestamp,
        header: promise.value.content.header,
        amount: promise.value.content.promise.amount,
        denomination: promise.value.content.promise.denomination,
        memo: promise.value.content.promise.memo,
        tags: promise.value.content.promise.tags,
        author: {type: "FEED", id: promise.value.author, commonName: promise.value.content.from.commonName, reserves: promise.value.content.from.reserves},
        recipient: promise.value.content.to,
        nonce: promise.value.content.promise.nonce,
        issueDate: promise.value.content.promise.issueDate,
        vestDate: promise.value.content.promise.vestDate,
        claimName: promise.value.content.promise.claimName,
        claim: {
           data: promise.value.content.promise.claimData,
           fromSignature: promise.value.content.promise.fromSignature,
           toSignature: promise.value.content.promise.toSignature,
        }
      }
  }

  identityReducer(idMsg) {
    idMsg.value.content.feed.type = "FEED";
    return {
      type: "IDENTITY",
      id: idMsg.key,
      sequence: idMsg.value.sequence,
      hash: idMsg.value.hash.toUpperCase(),
      header: idMsg.value.content.header,
      previous: idMsg.value.previous,
      signature: idMsg.value.signature,
      timestamp: idMsg.value.timestamp,
      author: {id: idMsg.value.author},
      feed: idMsg.value.content.feed,
      name: idMsg.value.content.name,
      evidence: idMsg.value.content.evidence,
    }
  }

  genericReducer(msg) {
      return {
        type: "GENERIC",
        id: msg.key,
        author: {id: msg.value.author},
        sequence: msg.value.sequence,
        hash: msg.value.hash.toUpperCase(),
        previous: msg.value.previous,
        signature: msg.value.signature,
        timestamp: msg.value.timestamp,
        content: JSON.stringify(msg.value.content),
    }
  }

  completeSettlementReducer(msg) {
      return {
          type: "COMPLETE_SETTLEMENT",
          id: msg.key,
          author: {id: msg.value.author},
          hash: msg.value.hash.toUpperCase(),
          header: msg.value.content.header,
          previous: msg.value.previous,
          signature: msg.value.signature,
          timestamp: msg.value.timestamp,
          claim: msg.value.content.claim,
          claimName: msg.value.content.claimName,
          nonce: msg.value.content.nonce,
          amount: msg.value.content.amount,
          denomination: msg.value.content.denomination,
          tx: msg.value.content.tx,
      }
  }

  async getFeed({ feedId }) {
      let reserves, commonName;
      let cseq = -1;
      let rseq;
      let idMsgs = await this.getIdMsgsByFeedId({ feedId });
      let accounts = [];
      // Not the most efficient to search through all of the Id Messages from pub, every time
      let evidenceMsgs = await this.getIdMsgsByFeedId({feedId: ssb.client().id});
      let evidenceMap = {};
      for (let k=0; k<evidenceMsgs.length; k++) {
        if (evidenceMsgs[k].feed.id==feedId) {
            evidenceMap[evidenceMsgs[k].id] = evidenceMsgs[k];
        }
      }
      for (let j=0; j<idMsgs.length; j++) {
        if (idMsgs[j].feed.id == feedId) {
            if (idMsgs[j].name.type == "COMMON" && cseq<idMsgs[j].sequence) {
                commonName = idMsgs[j].name;
                cseq = idMsgs[j].sequence;
            }
            if (idMsgs[j].name.type == "RESERVES" && (reserves==null || rseq>idMsgs[j].sequence)) {
                reserves = idMsgs[j].name;
                rseq = idMsgs[j].sequence;
            }
            if (idMsgs[j].name.type == "ACCOUNT") {
                eMsg = evidenceMap[idMsgs[j].evidence.id];
                if (eMsg !== undefined) {
                    if (eMsg.name.type=="ACCOUNT" && eMsg.name.handle==idMsgs[j].name.handle && eMsg.name.accountType==idMsgs[j].name.accountType) {
                        accounts.push(idMsgs[j].name);
                    }
                    break
                }
            }
        }
      }
      let allPromises = await this.getAllPromises();
      let promised = [];
      let settlements = [];
      let settled = [];
      let accountStubs = [];
      for (let z=0; z<accounts.length; z++) {
          accountStubs.push(accounts[z].accountType+accounts[z].handle);
      }
      for (let i=0; i<allPromises.length; i++) {
          if (allPromises[i].isLatest && allPromises[i].recipient.id == feedId) {
            let settlement = await this.getSettlementByClaimName({ claimName: allPromises[i].claimName});
            if (settlement.length==0) {
                promised.push(allPromises[i]);
            } else {
                settlements.push(settlement[0]);
                settled.push(allPromises[i]);
            }
          } else if (allPromises[i].isLatest && allPromises[i].recipient.id==null) {             
            if (accountStubs.includes(allPromises[i].recipient.verifiedAccounts[0].accountType+allPromises[i].recipient.verifiedAccounts[0].handle)) {
                promised.push(allPromises[i]);
            }
          }
      }
      let promises = await this.getPromisesByFeedId({ feedId });
      let liabilities = [];
      for (let n=0; n<promises.length; n++) {
          if (promises[n].isLatest) {
            let settlement = await this.getSettlementByClaimName({ claimName: promises[n].claimName});
            if (settlement.length==0) {
                liabilities.push(promises[n]);
            } else {
                settlements.push(settlement[0]);
                settled.push(promises[n]);
            }
          }
      }
      let feedMsgs = await this.getFeedMessages({ feedId });
      return {
          id: feedId,
          publicKey: feedId.substring(1, feedId.length),
          messages: feedMsgs,
          assets: promised,
          verifiedAccounts: accounts,
          reserves: reserves,
          commonName: commonName,
          liabilities: liabilities,
          settlements: settlements,
          settledPromises: settled,
      }
  }

  async getIdMsgsByFeedId({ feedId }) {
    const myQuery = [{
        "$filter": {
        value: {
            author: feedId,
            content: {
                type: "cashless/identity",
                header: {version: this.version, network: this.network},
            }
        }
      }
    }];
    try {
        let results = await streamPull(
            this.ssb.client().query.read({
                query: myQuery,
            })
        );
        return results.map(result => this.identityReducer(result));
    } catch(e) {
        console.log("ERROR QUERYING FLUME DB:", e);
        return [];
    }  
  }

  async getAllIdMsgs() {
    const myQuery = [{
        "$filter": {
        value: {
            content: {
                type: "cashless/identity",
                header: {version: this.version, network: this.network},
            }
        }
      }
    }];
    try {
        let results = await streamPull(
            this.ssb.client().query.read({
                query: myQuery,
            })
        );
        return results.map(result => this.identityReducer(result));
    } catch(e) {
        console.log("ERROR QUERYING FLUME DB:", e);
        return [];
    }
  }

  async getAllSettlementMsgs() {
    const myQuery = [{
        "$filter": {
        value: {
            content: {
                type: "cashless/complete-settlement",
                header: {version: this.version, network: this.network},
            }
        }
      }
    }];
    try {
        let results = await streamPull(
            this.ssb.client().query.read({
                query: myQuery,
            })
        );
        return results.map(result => this.completeSettlementReducer(result));
    } catch(e) {
        console.log("ERROR QUERYING FLUME DB:", e);
        return [];
    } 
  }
  async getSettlementByClaimName({ claimName }) {
    const myQuery = [{
        "$filter": {
        value: {
            content: {
                type: "cashless/complete-settlement",
                header: {version: this.version, network: this.network},
                claimName: claimName,
            }
        }
      }
    }];
    try {
        let results = await streamPull(
            this.ssb.client().query.read({
                query: myQuery,
            })
        );
        return results.map(result => this.completeSettlementReducer(result));
    } catch(e) {
        console.log("ERROR QUERYING FLUME DB:", e);
        return [];
    } 
  }
  async getPendingPromisesByFeedId({ feedId }) {
    let promises = await this.getPromisesByFeedId({ feedId });
    let output = [];
    for (let i=0; i<promises.length; i++) {
        if (promises[i].isLatest && promises[i].nonce==0) {
            output.push(promises[i]);
        }
    }
    return output;
  }

  async getPromisesByFeedId({ feedId }) {
    const myQuery = [{
        "$filter": {
        value: {
            author: feedId,
            content: {
                type: "cashless/promise",
                header: {version: this.version, network: this.network},
            }
        }
      }
    }];
    try {
        let results = await streamPull(
            this.ssb.client().query.read({
                query: myQuery,
            })
        );
        let promises = results.map(result => this.promiseReducer(result));
        let promiseMap = {};
        for (let j=0; j<promises.length; j++) {
            promises[j].isLatest = false;
            if (promiseMap[promises[j].claimName] !== undefined) {
                promiseMap[promises[j].claimName].push(promises[j]);
            } else {
                promiseMap[promises[j].claimName] = [promises[j]];
            }
        }
        let keys = Object.keys(promiseMap);
        let finalPromises = [];
        for (let i=0; i<keys; i++) {
            let pList = promiseMap[keys[i]];
            let proms = pList.sort((a, b) => (a.nonce > b.nonce) ? -1 : 1);
            proms[0].isLatest = true;
            finalPromises.push(...proms);
        }
        return finalPromises;
    } catch(e) {
        console.log("ERROR QUERYING FLUME DB:", e);
        return [];
    }
  }

  async getAllPromises() {
    try {
        let ids = await this.getFeedIds();
        let promises = [];
        for (let i=0; i<ids.length; i++) {
            let feedPromises = await this.getPromisesByFeedId({feedId: ids[i]});
            promises.push(...feedPromises);
        }
        return promises;
    } catch(e) {
        console.log("ERROR QUERYING FLUME DB:", e);
        return [];
    }
  }

  async getPromiseChain({ claimName, feedId }) {
    const myQuery = [{
        "$filter": {
        value: {
            author: feedId,
            content: {
                promise: {
                    claimName: claimName
                }
            }
        }
      }
    }];
    try {
        let results = await streamPull(
            this.ssb.client().query.read({
                query: myQuery,
            })
        );
        let promises = results.map(result=> this.promiseReducer(result));
        let highest = 0;
        for (let i=0; i<promises.length; i++) {
            if (promises[i].nonce > highest) {
                highest = promises[i].nonce;
            }
        }
        for (let j=0; j<promises.length; j++) {
            if (promises[j].nonce<highest) {
                promises[j].isLatest = false;
            } else {
                promises[j].isLatest = true;
            }
        }
        return promises;
    } catch(e) {
        console.log("ERROR QUERYING FLUME DB:", e);
        return [];
    }
  }

  async getPromise({ claimName, feedId, nonce }) {
    let promiseChain = await this.getPromiseChain({claimName, feedId});
    let promise;
    for (let i=0; i<promiseChain.length; i++) {
        if (promiseChain[i].nonce==nonce) {
            promise = promiseChain[i];
            break
        }
    }

    return promise;
  }

  async getFeedIds() {
      let msgs = await this.getAllIdMsgs();
      let allIds = new Set(msgs.map(msg => msg.author.id));
      return [...allIds];
  }

  async getFeedMessages({ feedId }) {
    const myQuery = [{
        "$filter": {
        value: {
            author: feedId
        }
      }
    }];
    try {
        let results = await streamPull(
            this.ssb.client().query.read({
                query: myQuery,
            })
        );
        let promises = await this.getPromisesByFeedId({ feedId });
        let promiseDict = {};
        for (let j=0; j<promises.length; j++) {
            promiseDict[promises[j].id] = promises[j];
        }
        let output = [];
        for (let i=0; i<results.length; i++) {
            if (results[i].value.content.type=="cashless/promise") {
                output.push(promiseDict[results[i].key]);
            } else if (results[i].value.content.type=="cashless/identity") {
                output.push(this.identityReducer(results[i]));
            } else if (results[i].value.content.type=="cashless/complete-settlement") {
                output.push(this.completeSettlementReducer(results[i]));
            } else {
                output.push(this.genericReducer(results[i]));
            }
        }
        return output;
    } catch(e) {
        console.log("ERROR QUERYING FLUME DB:", e);
        return [];
    }
  }
}

module.exports = ssbFlumeAPI;