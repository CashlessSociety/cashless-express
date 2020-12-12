const { ApolloServer } = require('apollo-server');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const ssbFlumeAPI = require('./datasource');
require("dotenv").config();

const dataSources = () => ({
    ssbFlumeAPI: new ssbFlumeAPI(),
});

const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources,
    inrospection: true,
  });
  
  server.listen(process.env.APOLLO_PORT || 4000).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });