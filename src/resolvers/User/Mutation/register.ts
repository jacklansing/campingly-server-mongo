import argon2 from 'argon2';
import { ApolloError } from 'apollo-server-express';
import {
  MutationRegisterArgs,
  UserResponse,
} from '../../../resolvers/types/user.types';
import { MyContext } from '../../../types';
import { RegisterSchema } from '../../../utils/validators/UserSchemas';
import { useValidationSchema } from '../../../utils/validators/useValidationSchema';
import UserModel from '../../../models/user';

export const register = async (
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
  } catch (e) {
    console.error(e);
    throw new ApolloError('Error adding new user');
  }
  // store user id session
  // set a cookie on the user and keep them logged in
  req.session.userId = user.id;
  return { user };
};
