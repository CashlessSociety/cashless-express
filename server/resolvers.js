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
                return 'ReservesAddress';
            } else if (msg.type == "ACCOUNT") {
                return 'Account';
            } else {
                return 'CommonName';
            }
        },
    },
    Evidence: {
        __resolveType(_msg, _context, _info){
            return 'Message';
        }
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
        allIdMsgs: (_, __, {dataSources}) =>
            dataSources.ssbFlumeAPI.getAllIdMsgs(),
        pendingPromises: (_, { id }, {dataSources}) =>
            dataSources.ssbFlumeAPI.getPendingPromisesByFeedId({ feedId: id }),
    }
  };