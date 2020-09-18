import { MiddlewareFn } from 'type-graphql';
import { MyContext } from 'src/types';
import { AuthenticationError } from 'apollo-server-express';

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new AuthenticationError('must authenticate');
  }
  return next();
};
