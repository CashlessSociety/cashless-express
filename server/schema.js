const { gql } = require('apollo-server');
const Date = require('graphql-date');


const typeDefs = gql`
    scalar Date

    type Feed {
        id: ID
        publicKey: String
        commonName: CommonName
        messages: [Message]
        reserves: ReservesAccount
        assets: [PromiseMessage]
        liabilities: [PromiseMessage]
    }

    interface Name {
        type: NameType!
    }

    type ReservesAccount implements Name {
        type: NameType!
        address: String
        alias: ReservesAlias
        initialized: Boolean
    }

    type ReservesAlias {
        name: String!
        hash: HashFunc!
    }

    type CommonName implements Name {
        type: NameType!
        name: String!
        id: ID!
    }

    interface Message {
        id: ID!
        type: MsgType!
        previous: String
        header: Header
        hash: HashFunc!
        author: Feed!
        sequence: Int!
        timestamp: Date!
        signature: String!
    }

    type PromiseMessage implements Message {
        id: ID!
        type: MsgType!
        header: Header
        previous: String
        hash: HashFunc!
        author: Feed!
        sequence: Int!
        timestamp: Date!
        signature: String!
        recipient: Feed!
        amount: Float!
        issueDate: String!
        vestDate: String!
        denomination: Denomination!
        memo: String
        tags: [String]
        reservesClaim: ReservesClaim!
        resolved: Boolean
    }

    type IdentityMessage implements Message {
        id: ID!
        type: MsgType!
        header: Header
        previous: String
        hash: HashFunc!
        author: Feed!
        sequence: Int!
        timestamp: Date!
        signature: String!
        name: Name!
    }

    type GenericMessage implements Message {
        id: ID!
        type: MsgType!
        header: Header
        previous: String
        hash: HashFunc!
        author: Feed!
        sequence: Int!
        timestamp: Date!
        signature: String!
        content: String
    }

    type ReservesClaim {
        data: String!
        fromSignature: EthereumSignature
        toSignature: EthereumSignature
    }

    type Header {
        version: Float
        network: String
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
        IDENTITY
        GENERIC
    }

    enum NameType {
        COMMON
        RESERVES
        ACCOUNT
    }

    type Query {
        promises(id: ID!): [PromiseMessage]
        allPromises: [PromiseMessage]
        messages(id: ID!): [Message]
        feed(id: ID!): Feed
        feedIds: [ID]
        allIdMsgs: [IdentityMessage]
    }
`;

module.exports = typeDefs;