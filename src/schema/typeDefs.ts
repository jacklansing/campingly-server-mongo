import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type User @entity {
    id: String @id
    username: String! @column
    displayName: String! @column
    email: String! @column
    createdAt: String! @column
    updatedAt: String! @column
    campsites: [Campsite]! @link
  }

  type Campsite @entity {
    id: String @id
    name: String! @column
    startingDate: String! @column
    endingDate: String! @column
    manager: User! @link
    counselors: [User]! @link
    campers: [User]! @link
    gearCategories: [GearCategory] @embedded
  }

  type GearCategory @entity(embedded: true) {
    category: String! @column
    gear: [Gear] @embedded
  }

  type Gear @entity(embedded: true) {
    name: String! @column
    quantity: Int! @column
    volunteers: [GearVolunteer]! @embedded
  }

  type GearVolunteer @entity(embedded: true) {
    userId: User! @link
    volunteerAmount: Int! @column
  }

  type ErrorMessage {
    message: String!
  }

  type FieldErrors {
    field: String!
    message: String!
  }

  type UserResponse {
    user: User
    errors: [FieldErrors]
  }

  type LogoutResponse {
    success: Boolean!
    errors: [ErrorMessage]
  }

  type Query {
    me: User
    getCampsite(campsiteId: String!): Campsite
  }

  type Mutation {
    register(input: RegistrationInput!): UserResponse
    login(input: LoginInput!): UserResponse
    logout: LogoutResponse
    forgotPassword(email: String!): Boolean
    resetPassword(input: ResetPasswordInput!): UserResponse
  }

  input RegistrationInput {
    username: String!
    email: String!
    displayName: String
    password: String!
  }

  input LoginInput {
    usernameOrEmail: String!
    password: String!
  }

  input ResetPasswordInput {
    token: String!
    newPassword: String!
  }
`;

export default typeDefs;
