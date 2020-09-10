const { gql } = require('apollo-server');

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

    type Feed {
        id: ID!
        #publicKey: String!
        messages: [Message]
        reserves: ReservesAccount
        assets: [PromiseMessage]
        liabilites: [PromiseMessage]
    }

    type ReservesAccount {
        address: String!
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
        timestamp: Int!
        signature: String!
    }

    type PromiseMessage implements Message {
        id: ID!
        msgType: MsgType!
        previous: String
        hash: HashFunc!
        author: Feed!
        sequence: Int!
        timestamp: Int!
        signature: String!
        from: ReservesAccount!
        to: ReservesAccount!
        amount: Float!
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