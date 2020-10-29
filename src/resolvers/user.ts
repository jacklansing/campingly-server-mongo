import argon2 from 'argon2';
import { MyContext } from 'src/types';
import { v4 } from 'uuid';
import { COOKIE_NAME, FORGOT_PASS_PREFIX } from '../constants';
import sendForgotPasswordEmail from '../utils/sendForgotPasswordEmail';
import {
  PasswordResetSchema,
  RegisterSchema,
} from '../utils/validators/UserSchemas';
import { useValidationSchema } from '../utils/validators/useValidationSchema';
import UserModel from '../models/user';
import {
  MutationLoginArgs,
  MutationRegisterArgs,
  UserResponse,
  User,
  MutationResetPasswordArgs,
  LogoutResponse,
} from '../generated/graphql';
import { ApolloError } from 'apollo-server-express';

export default {
  Query: {
    me: async (_: undefined, __: {}, { req }: MyContext) => {
      if (!req.session.userId) {
        return null;
      }

      return UserModel.findById(req.session.userId).exec();
    },
  },
  Mutation: {
    register: async (
      _: undefined,
      { input }: MutationRegisterArgs,
      { req }: MyContext,
    ): Promise<UserResponse> => {
      const { errors } = await useValidationSchema(input, RegisterSchema);
      if (errors) return { errors };

      // Check to see if username is already taken
      const usernameTaken = await UserModel.findOne({
        username: input.username,
      }).exec();

      if (usernameTaken) {
        return {
          errors: [
            {
              field: 'username',
              message: 'already taken',
            },
          ],
        };
      }
      const emailTaken = await UserModel.findOne({ email: input.email });
      if (emailTaken) {
        return {
          errors: [
            {
              field: 'email',
              message: 'account already exists using that email',
            },
          ],
        };
      }

      const hashedPassword = await argon2.hash(input.password);
      const user = new UserModel({
        username: input.username,
        displayName: input.displayName,
        password: hashedPassword,
        email: input.email,
      });
      try {
        // Save user to database
        await user.save();
      } catch {
        throw new ApolloError('Error adding new user');
      }
      // store user id session
      // set a cookie on the user and keep them logged in
      req.session.userId = user.id;
      const createdUser = user.toObject();
      return { user: createdUser };
    },
    login: async (
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
      const userInfo = user.toObject();
      const valid = await argon2.verify(userInfo.password, password);
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
      return { user: userInfo };
    },
    logout: async (
      _: undefined,
      __: {},
      { req, res }: MyContext,
    ): Promise<LogoutResponse> => {
      return new Promise((resolve) =>
        req.session.destroy((err) => {
          res.clearCookie(COOKIE_NAME);
          if (err) {
            resolve({
              success: false,
              errors: [
                {
                  message: 'There was an error logging out',
                },
              ],
            });
          }
          resolve({ success: true });
        }),
      );
    },
    resetPassword: async (
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
      const userObj: User = user.toObject();
      return { user: userObj };
    },
    forgotPassword: async (
      _: undefined,
      { email }: { email: string },
      { redis }: MyContext,
    ): Promise<Boolean> => {
      const user = await UserModel.findOne({ email });
      if (!user) {
        // Email is not in the database.
        await new Promise((r) => setTimeout(r, 500));
        return true;
      }
      const token = v4();

      await redis.set(
        FORGOT_PASS_PREFIX + token,
        user.id,
        'ex',
        1000 * 60 * 60 * 24 * 3,
      );

      await sendForgotPasswordEmail(email, token);

      return true;
    },
  },
};
