import { makeExecutableSchema } from 'apollo-server-express';
import {
  resolvers as customScalarResolvers,
  typeDefs as customScalarTypeDefs,
} from 'graphql-scalars';
import { typeDefs as Root } from './root';
import { typeDefs as Shared } from './shared';
import { typeDefs as User } from './user';
import { typeDefs as Campsite } from './campsite';
import campsiteResolver from '../resolvers/campsite.resolver';
import userResolver from '../resolvers/user.resolver';

export const buildSchema = () =>
  makeExecutableSchema({
    typeDefs: [...customScalarTypeDefs, Root, Shared, User, Campsite],
    resolvers: [customScalarResolvers, userResolver, campsiteResolver],
  });
