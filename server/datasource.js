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
        for (let j=0; j<promise.value.content.to.verifiedAccounts.length; i++) {
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

  async getFeed({ feedId }) {
      let reserves, commonName;
      let cseq = -1;
      let rseq;
      let idMsgs = await this.getIdMsgsByFeedId({ feedId });
      let accounts = [];
      for (let j=0; j<idMsgs.length; j++) {
          if (idMsgs[j].name.type == "COMMON" && cseq<idMsgs[j].sequence) {
            commonName = idMsgs[j].name;
            cseq = idMsgs.sequence;
          }
          if (idMsgs[j].name.type == "RESERVES" && (reserves==null || rseq>idMsgs[j].sequence)) {
            reserves = idMsgs[j].name;
            rseq = idMsgs[j].sequence;
          }
          if (idMsgs[j].name.type == "ACCOUNT") {
            // NOTE assumes the pub on this server is the "trusted" feed publishing identity links aftter firebase auth
            let msgs = this.getFeedMessages(ssb.client().id);
            for (let k=0; k<msgs.length; k++) {
                if (msgs[k].id == idMsgs[j].name.evidence.id && msgs[k].type=="IDENTITY") {
                    if (msgs[k].feed.id==feedId && msgs[k].name.type=="ACCOUNT" && msg.name.handle==idMsgs[j].name.handle) {
                        accounts.push(idMsgs[j].name);
                    }
                    break
                }
            }
          }
      }
      let allPromises = await this.getAllPromises();
      let liabilities = [];
      for (let i=0; i<allPromises.length; i++) {
          if (allPromises[i].isLatest && allPromises[i].recipient.id == feedId) {
            liabilities.push(allPromises[i]);
          }
      }
      let promises = await this.getPromisesByFeedId({ feedId });
      let assets = [];
      for (let n=0; n<promises.length; n++) {
          if (promises[n].isLatest) {
            assets.push(promises[n]);
          }
      }
      return {
          id: feedId,
          publicKey: feedId.substring(1, feedId.length),
          messages: this.getFeedMessages({ feedId }),
          assets: promises,
          verifiedAccounts: accounts,
          reserves: reserves,
          commonName: commonName,
          liabilities: liabilities,
      }
  }

  async getFeedIds() {
      console.log("LOG THIS");
      let allIdMsgs = this.getAllIdMsgs();
      console.log(allIdMsgs);
      let allIds = [];
      for (let i=0; i<allIdMsgs.length; i++) {
        allIds.push(allIdMsgs[i].author.id);
      }
      let ids = new Set(allIds);
      return [...ids];
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

  async getPendingPromisesByFeedId({ feedId }) {
    let promises = this.getPromisesByFeedId({ feedId });
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
        // TODO: this can be done more efficiently/elegantly
        for (let i=0; i<promises.length; i++) {
            let isLatest = true;
            for (let j=0; j<promises.length; j++) {
                if (promises[j].claimName==promises[i].claimName && promises[j].nonce>promises[i].nonce) {
                    isLatest = false;
                    break
                }
            }
            promises[i].isLatest = isLatest;
        }
        return promises;
    } catch(e) {
        console.log("ERROR QUERYING FLUME DB:", e);
        return [];
    }
  }

  async getAllPromises() {
    const myQuery = [{
        "$filter": {
        value: {
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
        // TODO: this can be done more efficiently/elegantly
        for (let i=0; i<promises.length; i++) {
            let isLatest = true;
            let checkId = promises[i].author.id;
            let checkPromises = this.getPromisesByFeedId({ checkId });
            for (let j=0; j<checkPromises.length; j++) {
                if (checkPromises[j].claimName==promises[i].claimName && checkPromises[j].nonce>promises[i].nonce) {
                    isLatest = false;
                    break
                }
            }
            promises[i].isLatest = isLatest;
        }
        return promises;
    } catch(e) {
        console.log("ERROR QUERYING FLUME DB:", e);
        return [];
    }
  }

  async getFeedMessages({ feedId }) {
    const myQuery = [{
        "$filter": {
        value: {
            author: feedId,
        }
      }
    }];
    try {
        let results = await streamPull(
            this.ssb.client().query.read({
                query: myQuery,
            })
        );
        return results.map(result => {if (result.value.content.type=="cashless/promise") {this.promiseReducer(result)} else if (result.value.content.type=="cashless/identity") {this.identityReducer(result)} else {this.genericReducer(result)}});
    } catch(e) {
        console.log("ERROR QUERYING FLUME DB:", e);
        return [];
    }
  }
}

module.exports = ssbFlumeAPI;