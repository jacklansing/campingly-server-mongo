import argon2 from 'argon2';
import { ApolloError } from 'apollo-server-express';
import { FORGOT_PASS_PREFIX } from '../../../constants';
import {
  MutationResetPasswordArgs,
  UserResponse,
} from '../../../resolvers/types/user.types';
import { MyContext } from '../../../types';
import { PasswordResetSchema } from '../../../utils/validators/UserSchemas';
import { useValidationSchema } from '../../../utils/validators/useValidationSchema';
import UserModel from '../../../models/user';

export const resetPassword = async (
  _: undefined,
  { input: { token, newPassword } }: MutationResetPasswordArgs,
  { redis, req }: MyContext,
): Promise<UserResponse> => {
  const { errors } = await useValidationSchema(
    { password: newPassword },
    PasswordResetSchema,
  );
  if (errors) return { errors };
  const redisKey = FORGOT_PASS_PREFIX + token;
  const userId = await redis.get(redisKey);
  if (!userId) {
    return {
      errors: [
        {
          field: 'token',
          message: 'token expired',
        },
      ],
    };
  }
  const user = await UserModel.findOne({ id: userId });

  if (!user) {
    return {
      errors: [
        {
          field: 'token',
          message: 'user no longer exists',
        },
      ],
    };
  }

  const hashedPassword = await argon2.hash(newPassword);
  //@ts-ignore
  user.password = hashedPassword;
  try {
    await user.save();
  } catch {
    throw new ApolloError('Error saving new password');
  }
  // Delete token so that it cannot be reused after pw change
  await redis.del(redisKey);
  // Login user after change password (optional)
  req.session.userId = user.id;
  return { user };
};
