import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type User {
    id: ObjectID
    username: String!
    displayName: String
    email: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type UserResponse {
    user: User
    errors: [FieldError]
  }

  type LogoutResponse {
    success: Boolean!
    errors: [ErrorMessage]
  }

  extend type Query {
    me: User
  }

  extend type Mutation {
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
