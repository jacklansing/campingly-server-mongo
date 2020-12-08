import { makeExecutableSchema } from 'apollo-server-express';
import typeDefs from '../schema/typeDefs';
import userResolver from '../resolvers/user.resolver';
import campsiteResolver from '../resolvers/campsite.resolver';
import {
  typeDefs as customScalarTypeDefs,
  resolvers as customScalarResolvers,
} from 'graphql-scalars';

export const buildSchema = () =>
  makeExecutableSchema({
    typeDefs: [...customScalarTypeDefs, typeDefs],
    resolvers: [customScalarResolvers, userResolver, campsiteResolver],
  });
