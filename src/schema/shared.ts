import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  directive @objectAuth(requires: Role = LOGIN) on OBJECT
  directive @fieldAuth(requires: Role = LOGIN) on FIELD_DEFINITION

  enum Role {
    LOGIN
    USER
    COUNSELOR
    MANAGER
  }

  type ErrorMessage {
    message: String!
  }

  type FieldError {
    field: String!
    message: String!
  }
`;
