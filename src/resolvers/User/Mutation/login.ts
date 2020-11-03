import argon2 from 'argon2';
import {
  MutationLoginArgs,
  UserResponse,
} from '../../../resolvers/types/user.types';
import { MyContext } from '../../../types';
import UserModel from '../../../models/user';

export const login = async (
  _: undefined,
  { input: { usernameOrEmail, password } }: MutationLoginArgs,
  { req }: MyContext,
): Promise<UserResponse> => {
  const user = await UserModel.findOne({
    $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
  });
  if (!user) {
    return {
      errors: [
        {
          field: 'usernameOrEmail',
          message: "that account doesn't exist",
        },
      ],
    };
  }
  const valid = await argon2.verify(user.password, password);
  if (!valid) {
    return {
      errors: [
        {
          field: 'password',
          message: 'incorrect password',
        },
      ],
    };
  }

  req.session.userId = user.id;
  return { user };
};
