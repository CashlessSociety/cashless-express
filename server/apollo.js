const { ApolloServer } = require('apollo-server');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');


const server = new ApolloServer({
    typeDefs,
    resolvers,
    mocks: true,
  });
  
  server.listen(process.env.APOLLO_PORT || 4000).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });