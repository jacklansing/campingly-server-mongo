import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Query {
    # I need to exist to be extended, for now.
    root: String
  }

  type Mutation {
    # I need to exist to be extended, for now.
    root: String
  }
`;
