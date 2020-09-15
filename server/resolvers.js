module.exports = {
    Message: {
        __resolveType(msg, _context, _info){
            if (msg.type == "PROMISE") {
                return 'PromiseMessage';
            } else if (msg.type == "IDENTITY") {
                return 'IdentityMessage';
            } else {
                return 'GenericMessage';
            }
        },
    },
    Name: {
        __resolveType(msg, _context, _info){
            if (msg.type == "RESERVES") {
                return 'ReservesAccount';
            } else {
                return 'CommonName';
            }
        },
    },
    Query: {
        promises: (_, { id }, {dataSources}) =>
            dataSources.ssbFlumeAPI.getPromisesByFeedId({ feedId: id }),
        allPromises: (_, __, {dataSources}) =>
            dataSources.ssbFlumeAPI.getAllPromises(),
        messages: (_, { id }, { dataSources }) =>
            dataSources.ssbFlumeAPI.getFeedMessages({ feedId: id }),
        feed: (_, { id }, { dataSources }) =>
            dataSources.ssbFlumeAPI.getFeed({ feedId: id }),
        feedIds: (_, __, {dataSources}) =>
            dataSources.ssbFlumeAPI.getFeedIds(),
        allIdMsgs: (_, __, {dataSources}) =>
            dataSources.ssbFlumeAPI.getAllIdMsgs(),
    }
  };