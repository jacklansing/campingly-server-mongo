import { graphql, GraphQLSchema } from 'graphql';
import { Maybe } from 'type-graphql';
import { createSchema } from '../../utils/createSchema';
import { MockRedis } from './MockRedis';

interface Options {
  source: string;
  variableValues?: Maybe<{ [key: string]: any }>;
  userId?: number;
  clearCookie?: jest.Mock<any, any>;
  destroy?: jest.Mock<any, any>;
  redis?: MockRedis;
}

let schema: GraphQLSchema;

export const useRequest = async ({
  source,
  variableValues,
  userId,
  clearCookie = jest.fn(),
  destroy = jest.fn(),
  redis = new MockRedis(),
}: Options) => {
  if (!schema) {
    schema = await createSchema();
  }
  return graphql({
    schema,
    source,
    variableValues,
    contextValue: {
      req: {
        session: {
          userId,
          destroy,
        },
      },
      res: {
        clearCookie,
      },
      redis,
    },
  });
};
