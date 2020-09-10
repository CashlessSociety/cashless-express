module.exports = {
    Query: {
      promises: (_, { id }, {dataSources}) =>
        dataSources.ssbFlumeAPI.getPromisesByFeedId({ feedId: id}),
    }
  };