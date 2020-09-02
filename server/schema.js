const { gql } = require('apollo-server');

const typeDefs = gql`
    type Identity {
        id: ID!
        names: [ClaimedCommonName]
        accounts: [ClaimedAccountHandle]
        feeds: [ClaimedFeed]
        assets: [PromiseMessage]
        liabilites: [PromiseMessage]
        #reciprocities: [ReciprocityMessage]
        #settlements: [SettlementMessage]
        reserves: [ClaimedReservesAccount]
        active: Boolean
    }

    interface Name {
        type: NameType!
    }

    type CommonName implements Name {
        id: ID!
        name: String!
        type: NameType!
    }

    type AccountHandle implements Name {
        handle: String!
        accountType: AccountType!
        type: NameType!
    }

    type Feed implements Name {
        id: ID!
        publicKey: String!
        active: Boolean
        peers: [Feed]
        messages: [Message]
        type: NameType!
    }

    type ReservesAccount implements Name {
        address: String!
        reservesContractAddress: String!
        active: Boolean
        aliases: [ReservesAlias]
        type: NameType!
    }

    type ClaimedCommonName {
        claim: IdentityClaim!
        commonName: CommonName
    }

    type ClaimedFeed {
        claim: IdentityClaim!
        feed: Feed
    }

    type ClaimedAccountHandle {
        claim: IdentityClaim!
        accountHandle: AccountHandle
    }

    type ClaimedReservesAccount {
        claim: IdentityClaim!
        reservesAccount: ReservesAccount
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
        previous: String
        hash: HashFunc!
        author: Feed!
        sequence: Int!
        timestamp: Int!
        signature: String!
    }

    type PromiseMessage implements Message {
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
        previous: String
        hash: HashFunc!
        author: Feed!
        sequence: Int!
        timestamp: Int!
        signature: String!
        identity: ID!
        name: Name
    }

    enum AccountType {
        TWITTER
        FACEBOOK
        GMAIL
        GITHUB
        INSTAGRAM
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

    type Query {
        identities: [Identity]!
        identity(id: ID!): Identity
    }
`;

module.exports = typeDefs;