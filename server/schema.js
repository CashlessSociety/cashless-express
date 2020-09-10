const { gql } = require('apollo-server');
const Date = require('graphql-date');


const typeDefs = gql`
    #type Identity {
        #id: ID!
        #names: [CommonName]
        #handles: [Handle]
        #feed: Feed
        #reserves: ReservesAccount
        #assets: [PromiseMessage]
        #liabilites: [PromiseMessage]
        #reciprocities: [ReciprocityMessage]
        #settlements: [SettlementMessage]
        #active: Boolean
    #}
    scalar Date

    type Feed {
        id: ID!
        messages: [Message]
        reserves: ReservesAccount
        assets: [PromiseMessage]
        liabilites: [PromiseMessage]
    }

    type ReservesAccount {
        address: String
        reservesContractAddress: String!
        aliases: [ReservesAlias]
        active: Boolean
    }

    type ReservesAlias {
        name: String!
        hash: HashFunc!
    }

    interface Message {
        id: ID!
        msgType: MsgType!
        previous: String
        hash: HashFunc!
        author: Feed!
        sequence: Int!
        timestamp: Date!
        signature: String!
    }

    type PromiseMessage implements Message {
        id: ID!
        msgType: MsgType!
        previous: String
        hash: HashFunc!
        author: Feed!
        sequence: Int!
        timestamp: Date!
        signature: String!
        from: ReservesAccount!
        to: ReservesAccount!
        amount: Float!
        issueDate: String!
        vestDate: String!
        denomination: Denomination
        memo: String
        tags: [String]
        reservesClaim: ReservesClaim
    }

    type ReservesClaim {
        data: String!
        fromSignature: EthereumSignature
        toSignature: EthereumSignature
    }

    type EthereumSignature {
        v: Int
        r: String
        s: String
    }

    enum HashFunc {
        SHA256
        KECCAK256
    }

    enum Denomination {
        USD
        ETH
    }

    enum MsgType {
        PROMISE
    }

    type Query {
        promises(id: ID!): [PromiseMessage]
    }
`;

module.exports = typeDefs;