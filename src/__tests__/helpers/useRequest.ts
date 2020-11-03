import { graphql, GraphQLSchema } from 'graphql';
import { Maybe } from 'type-graphql';
import { buildSchema } from '../../utils/buildSchema';
import { MockRedis } from './MockRedis';

interface Options {
  source: string;
  variableValues?: Maybe<{ [key: string]: any }>;
  userId?: number;
  csid?: number;
  clearCookie?: jest.Mock<any, any>;
  destroy?: jest.Mock<any, any>;
  redis?: MockRedis;
}

let schema: GraphQLSchema;

export const useRequest = async ({
  source,
  variableValues,
  userId,
  csid,
  clearCookie = jest.fn(),
  destroy = jest.fn(),
  redis = new MockRedis(),
}: Options) => {
  if (!schema) {
    schema = buildSchema();
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
        headers: {
          csid,
        },
      },
      res: {
        clearCookie,
      },
      redis,
    },
  });
};
