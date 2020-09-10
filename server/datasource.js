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


class ssbFlumeAPI extends DataSource {
  constructor() {
    super();
    this.ssb = ssb;
  }

  initialize(config) {
    this.context = config.context;
  }

  promisesReducer(promises, feedId) {
      let output = []
      for (let i=0; i<promises.length; i++) {
        output.push({
            msgType: promises[i].value.content.contentHeader.msgType,
            id: promises[i].key,
            sequence: promises[i].value.sequence,
            hash: promises[i].value.hash.toUpperCase(),
            previous: promises[i].value.previous,
            signature: promises[i].value.signature,
            timestamp: promises[i].value.timestamp,
            amount: promises[i].value.content.promise.amt,
            denomination: promises[i].value.content.promise.denomination,
            memo: promises[i].value.content.promise.memo,
            tags: promises[i].value.content.promise.tags,
            author: {id: feedId},
            issueDate: promises[i].value.content.promise.issueDate,
            vestDate: promises[i].value.content.promise.vestDate,
            from: {
               address: promises[i].value.content.from.address,
               aliases:  promises[i].value.content.from.aliases,
               reservesContractAddress: promises[i].value.content.contentHeader.cashlessReservesAddress,
            },
            to: {
                address: promises[i].value.content.to.address,
                aliases:  promises[i].value.content.to.aliases,
                reservesContractAddress: promises[i].value.content.contentHeader.cashlessReservesAddress,
            },
            reservesClaim: {
               data: promises[i].value.content.promise.claimData,
               fromSignature: promises[i].value.content.promise.fromSignature,
               toSignature: promises[i].value.content.promise.toSignature,
            }
        });
      }

      return output
  }

  async getPromisesByFeedId({ feedId }) {
    const myQuery = [{
        "$filter": {
        value: {
            author: feedId,
            content: {
                type: "cashless/promise"
            }
        }
      }
    }];
    try {
        let results = await streamPull(
            ssb.client().query.read({
                query: myQuery,
            })
        );
        return this.promisesReducer(results, feedId);
    } catch(e) {
        console.log("GOT AN ERROR GETTING PROMISES:", e)
        return [];
    }
  }
}

module.exports = ssbFlumeAPI;