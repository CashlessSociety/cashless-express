const { gql } = require('apollo-server');

const typeDefs = gql`
    type Identity {
        id: ID!
        names: [CommonName]
        handles: [Handle]
        feeds: [Feed]
        reserves: [ReservesAccount]
        assets: [PromiseMessage]
        liabilites: [PromiseMessage]
        #reciprocities: [ReciprocityMessage]
        #settlements: [SettlementMessage]
        active: Boolean
    }

    interface Name {
        nameType: NameType!
        identityClaim: IdentityClaim
    }

    type CommonName implements Name {
        nameType: NameType!
        id: ID!
        name: String!
        identityClaim: IdentityClaim
    }

    type Handle implements Name {
        nameType: NameType!
        handle: String!
        handleType: HandleType!
        identityClaim: IdentityClaim
    }

    type Feed implements Name {
        nameType: NameType!
        id: ID!
        publicKey: String!
        active: Boolean
        peers: [Feed]
        messages: [Message]
        identityClaim: IdentityClaim
    }

    type ReservesAccount implements Name {
        nameType: NameType!
        address: String!
        reservesContractAddress: String!
        active: Boolean
        aliases: [ReservesAlias]
        identityClaim: IdentityClaim
    }

    type IdentityClaim {
        name: Name
        owner: Identity
        confidence: Float
        messages: [IdentityMessage],
    }

    type ReservesAlias {
        name: String!
        hash: HashFunc!
    }

    interface Message {
        msgType: MsgType!
        previous: String
        hash: HashFunc!
        author: Feed!
        sequence: Int!
        timestamp: Int!
        signature: String!
    }

    type PromiseMessage implements Message {
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
        data: PromiseData
    }

    type PromiseData {
        signedClaim: String!
        fromSignature: EthereumSignature
        toSignature: EthereumSignature
    }

    type EthereumSignature {
        v: Int
        r: String
        s: String
    }

    type IdentityMessage implements Message {
        msgType: MsgType!
        previous: String
        hash: HashFunc!
        author: Feed!
        sequence: Int!
        timestamp: Int!
        signature: String!
        identity: ID!
        name: Name
    }

    enum NameType {
        RESERVES
        FEED
        HANDLE
        COMMON
    }

    enum HashFunc {
        SHA256
        KECCAK256
    }

    enum Denomination {
        USD
        ETH
    }

    enum HandleType {
        TWITTER
        FACEBOOK
        GMAIL
        GITHUB
        INSTAGRAM
    }

    enum MsgType {
        PROMISE
    }

    type Query {
        identities: [Identity]!
        identity(id: ID!): Identity
    }
`;

module.exports = typeDefs;