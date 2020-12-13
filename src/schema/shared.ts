import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  directive @objectAuth(requires: CampsiteRole = LOGIN) on OBJECT
  directive @fieldAuth(requires: CampsiteRole = LOGIN) on FIELD_DEFINITION

  enum CampsiteRole {
    CAMPER
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
