module.exports = {
    Query: {
      identities: (_, __, { dataSources }) =>
        dataSources.launchAPI.getAllLaunches(),
      identity: (_, { id }, { dataSources }) =>
        dataSources.launchAPI.getLaunchById({ launchId: id }),
    }
  };