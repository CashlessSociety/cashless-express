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

const network = "ropsten";

class ssbFlumeAPI extends DataSource {
  constructor() {
    super();
    this.ssb = ssb;
    this.network = network;
  }

  initialize(config) {
    this.context = config.context;
  }

  promiseReducer(promise) {
      if (promise.value.content.from.commonName != null) {
        promise.value.content.from.commonName.type = "COMMON";
      }
      promise.value.content.from.reserves.type = "RESERVES";
      if (promise.value.content.to.commonName != null) {
        promise.value.content.to.commonName.type = "COMMON";
      }
      promise.value.content.to.reserves.type = "RESERVES";
      return {
        type: "PROMISE",
        id: promise.key,
        sequence: promise.value.sequence,
        hash: promise.value.hash.toUpperCase(),
        previous: promise.value.previous,
        signature: promise.value.signature,
        timestamp: promise.value.timestamp,
        header: promise.value.content.header,
        amount: promise.value.content.promise.amt,
        denomination: promise.value.content.promise.denomination,
        memo: promise.value.content.promise.memo,
        tags: promise.value.content.promise.tags,
        author: {id: promise.value.author, commonName: promise.value.content.from.commonName, reserves: promise.value.content.from.reserves},
        recipient: promise.value.content.to,
        issueDate: promise.value.content.promise.issueDate,
        vestDate: promise.value.content.promise.vestDate,
        reservesClaim: {
           data: promise.value.content.promise.claimData,
           fromSignature: promise.value.content.promise.fromSignature,
           toSignature: promise.value.content.promise.toSignature,
        }
      }
  }

  identityReducer(idMsg) {
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
      name: idMsg.value.content.name,
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
      let promises = await this.getPromisesByFeedId({ feedId });
      let reserves, commonName;
      let cseq = -1;
      let rseq;
      let idMsgs = await this.getIdMsgsByFeedId({ feedId });
      for (let j=0; j<idMsgs.length; j++) {
          if (idMsgs[j].name.type == "COMMON" && cseq<idMsgs[j].sequence) {
            commonName = idMsgs[j].name;
            cseq = idMsgs.sequence;
          }
          if (idMsgs[j].name.type == "RESERVES" && (reserves==null || rseq>idMsgs[j].sequence)) {
            // ALERT POSSIBLE ISSUES ??
            reserves = idMsgs[j].name;
            rseq = idMsgs[j].sequence;
          }
      }
      let allPromises = await this.getAllPromises();
      let liabilities = [];
      for (let i=0; i<allPromises.length; i++) {
          // ALERT POSSIBLE ISSUES ??
          if (allPromises[i].recipient.id == feedId || (allPromises[i].recipient.reserves.alias===reserves.alias && reserves.alias != null)) {
            liabilities.push(allPromises[i]);
          }
      }
      return {
          id: feedId,
          publicKey: feedId.substring(1, feedId.length),
          messages: this.getFeedMessages({ feedId }),
          assets: promises,
          reserves: reserves,
          commonName: commonName,
          liabilities: liabilities,
      }
  }

  async getFeedIds() {
      let allIdMsgs = this.getAllIdMsgs();
      let allIds = new Set(allIdMsgs.map(msg => msg.author.id));
      return [...allIds];
  }

  async getIdMsgsByFeedId({ feedId }) {
    const myQuery = [{
        "$filter": {
        value: {
            author: feedId,
            content: {
                type: "cashless/identity",
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

  async getPromisesByFeedId({ feedId }) {
    const myQuery = [{
        "$filter": {
        value: {
            author: feedId,
            content: {
                type: "cashless/promise",
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
        return results.map(result => this.promiseReducer(result));
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
        return results.map(result => this.promiseReducer(result));
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