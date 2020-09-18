import { buildSchema } from 'type-graphql';
import { UserResolver } from '../resolvers/user';

export const createSchema = () =>
  buildSchema({ resolvers: [UserResolver], validate: false });
