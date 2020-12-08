import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import argon2 from 'argon2';
import { useRequest } from './helpers/useRequest';
import { getValidUser } from './helpers/mocks';
import UserModel from '../models/user';
import { MockRedis } from './helpers/MockRedis';
import { FORGOT_PASS_PREFIX } from '../constants';

const REGISTER_MUTATION = `
  mutation register($input: RegistrationInput!){
    register(input: $input) {
    errors {
      field
      message
    }
      user {
        username
        id
      }
    }
  }
`;

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      errors {
        field
        message
      }
        user {
          username
          id
        }
    }
  }
`;

const LOGOUT_MUTATION = `
  mutation {
    logout {
      success
      errors {
        message
      }
    }
  }
`;

const FORGOT_PASSWORD_MUTATION = `
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

const RESET_PASSWORD_MUTATION = `
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      user {
        id
        username
      }
      errors {
        field
        message
      }
    }
  }
`;

const ME_QUERY = `
  query {
    me {
      id
      username
      email
    }
  }
`;

const mongod = new MongoMemoryServer();

describe('User Resolver', () => {
  beforeAll(async () => {
    const uri = await mongod.getUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
  });

  afterEach(async () => {
    await mongoose.connection.collection('users').deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
  });

  describe('Mutation -> Register', () => {
    it(`Creates a new User with valid options`, async () => {
      const testUser = getValidUser();

      const res = await useRequest({
        source: REGISTER_MUTATION,
        variableValues: {
          input: {
            ...testUser,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res?.data).toMatchObject({
        register: {
          errors: null,
          user: {
            username: testUser.username,
          },
        },
      });

      const dbUser = await UserModel.findOne({ username: testUser.username });
      expect(dbUser).toBeDefined();
      expect(dbUser!.username).toBe(testUser.username);
      expect(dbUser!.id).toBe(res!.data!.register.user.id);
    });

    it(`Returns field errors when username too short`, async () => {
      const testUser = getValidUser();
      testUser.username = 'u';
      const res = await useRequest({
        source: REGISTER_MUTATION,
        variableValues: {
          input: {
            ...testUser,
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        register: {
          user: null,
          errors: [
            {
              field: 'username',
              message: 'Username cannot be less than 4 characters',
            },
          ],
        },
      });
    });

    it(`Returns field errors when username too long`, async () => {
      const testUser = getValidUser();
      testUser.username = 'Username_Too_Long';

      const res = await useRequest({
        source: REGISTER_MUTATION,
        variableValues: {
          input: {
            ...testUser,
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        register: {
          user: null,
          errors: [
            {
              field: 'username',
              message: 'Username cannot be more than 15 characters',
            },
          ],
        },
      });
    });

    it(`Returns field errors when username invalid`, async () => {
      const testUser = getValidUser();
      testUser.username = '..invalid..';

      const res = await useRequest({
        source: REGISTER_MUTATION,
        variableValues: {
          input: {
            ...testUser,
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        register: {
          user: null,
          errors: [
            {
              field: 'username',
              message:
                'Username may only contain letters, numbers, and underscores',
            },
          ],
        },
      });
    });

    it(`Returns field errors when password too short`, async () => {
      const testUser = getValidUser();
      testUser.password = 'Pz1!';
      const res = await useRequest({
        source: REGISTER_MUTATION,
        variableValues: {
          input: {
            ...testUser,
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        register: {
          user: null,
          errors: [
            {
              field: 'password',
              message: 'Password cannot be less than 8 characters',
            },
          ],
        },
      });
    });

    it(`Returns field errors when password too long`, async () => {
      const testUser = getValidUser();
      testUser.password = 'Pz1!'.repeat(20);
      const res = await useRequest({
        source: REGISTER_MUTATION,
        variableValues: {
          input: {
            ...testUser,
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        register: {
          user: null,
          errors: [
            {
              field: 'password',
              message: 'Password cannot be more than 30 characters',
            },
          ],
        },
      });
    });

    it(`Returns field errors when password is invalid`, async () => {
      const testUser = getValidUser();
      testUser.password = 'Password';
      const res = await useRequest({
        source: REGISTER_MUTATION,
        variableValues: {
          input: {
            ...testUser,
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        register: {
          user: null,
          errors: [
            {
              field: 'password',
              message:
                'Password must contain at least 1 uppercase letter, 1 lowercase letter, and a number',
            },
          ],
        },
      });
    });

    it(`Returns field error when username is already taken`, async () => {
      const testUser = getValidUser();
      const createdUser = await new UserModel(testUser).save();
      const res = await useRequest({
        source: REGISTER_MUTATION,
        variableValues: {
          input: {
            username: createdUser!.username,
            password: testUser.password,
            email: 'unusd1@unusd.com',
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        register: {
          user: null,
          errors: [
            {
              field: 'username',
              message: 'already taken',
            },
          ],
        },
      });
    });

    it(`Returns field error when email is already in use`, async () => {
      const testUser = getValidUser();
      const createdUser = await new UserModel(testUser).save();
      const res = await useRequest({
        source: REGISTER_MUTATION,
        variableValues: {
          input: {
            username: 'unused1',
            password: testUser.password,
            email: createdUser!.email,
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        register: {
          user: null,
          errors: [
            {
              field: 'email',
              message: 'account already exists using that email',
            },
          ],
        },
      });
    });
  });

  describe('Mutation -> Login', () => {
    it(`Returns user when login successful using username`, async () => {
      const testUser = getValidUser();
      const originalPassword = testUser.password;
      testUser.password = await argon2.hash(testUser.password);
      const dbUser = await new UserModel(testUser).save();

      const res = await useRequest({
        source: LOGIN_MUTATION,
        variableValues: {
          input: {
            usernameOrEmail: testUser.username,
            password: originalPassword,
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        login: {
          errors: null,
          user: {
            id: dbUser?.id,
            username: testUser.username,
          },
        },
      });
    });

    it(`Returns user when login successful using email`, async () => {
      const testUser = getValidUser();
      const originalPassword = testUser.password;
      testUser.password = await argon2.hash(testUser.password);
      const dbUser = await new UserModel(testUser).save();
      const res = await useRequest({
        source: LOGIN_MUTATION,
        variableValues: {
          input: {
            usernameOrEmail: testUser.username,
            password: originalPassword,
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        login: {
          errors: null,
          user: {
            id: dbUser?.id,
            username: testUser.username,
          },
        },
      });
    });

    it(`Returns field errors when password is incorrect`, async () => {
      const testUser = getValidUser();
      testUser.password = await argon2.hash(testUser.password);
      await new UserModel(testUser).save();
      const res = await useRequest({
        source: LOGIN_MUTATION,
        variableValues: {
          input: {
            usernameOrEmail: testUser.username,
            password: '__incorrect__',
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        login: {
          errors: [
            {
              field: 'password',
              message: 'incorrect password',
            },
          ],
          user: null,
        },
      });
    });

    it(`Returns field errors when user account does not exist`, async () => {
      const testUser = getValidUser();
      const res = await useRequest({
        source: LOGIN_MUTATION,
        variableValues: {
          input: {
            usernameOrEmail: testUser.username,
            password: '__doesnt__mater__',
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        login: {
          errors: [
            {
              field: 'usernameOrEmail',
              message: "that account doesn't exist",
            },
          ],
          user: null,
        },
      });
    });
  });

  describe('Mutation -> Logout', () => {
    it(`Calls clearCookie, session.destroy, and returns null user when successful`, async () => {
      const clearCookieMock = jest.fn();
      const destroySessionMock = jest.fn((fn) => {
        clearCookieMock();
        fn(false);
      });
      const res = await useRequest({
        source: LOGOUT_MUTATION,
        clearCookie: clearCookieMock,
        destroy: destroySessionMock,
      });
      expect(clearCookieMock).toHaveBeenCalled();
      expect(destroySessionMock).toHaveBeenCalled();
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        logout: {
          success: true,
          errors: null,
        },
      });
    });

    it(`Calls clearCookie, session.destroy, and returns error message when unsuccessful`, async () => {
      const clearCookieMock = jest.fn();
      const destroySessionMock = jest.fn((fn) => {
        clearCookieMock();
        fn(true);
      });
      const res = await useRequest({
        source: LOGOUT_MUTATION,
        clearCookie: clearCookieMock,
        destroy: destroySessionMock,
      });
      expect(clearCookieMock).toHaveBeenCalled();
      expect(destroySessionMock).toHaveBeenCalled();
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        logout: {
          errors: [
            {
              message: 'There was an error logging out',
            },
          ],
          success: false,
        },
      });
    });
  });

  describe('Mutation -> ForgotPassword', () => {
    it(`Returns true given valid email`, async () => {
      const testUser = getValidUser();
      const dbUser = await new UserModel(testUser).save();
      const res = await useRequest({
        source: FORGOT_PASSWORD_MUTATION,
        variableValues: {
          email: dbUser?.email,
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        forgotPassword: true,
      });
    });

    it(`Returns true given invalid email`, async () => {
      const testUser = getValidUser();
      await new UserModel(testUser).save();
      const res = await useRequest({
        source: FORGOT_PASSWORD_MUTATION,
        variableValues: {
          email: 'invalid@nope.com',
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        forgotPassword: true,
      });
    });
  });

  describe('Mutation -> ResetPassword', () => {
    it(`Returns user info upon success`, async () => {
      const TOKEN_STRING = 'token_string';
      const testUser = getValidUser();
      const dbUser = await new UserModel(testUser).save();
      const redis = new MockRedis();
      redis.set(FORGOT_PASS_PREFIX + TOKEN_STRING, dbUser!.id.toString());
      const res = await useRequest({
        source: RESET_PASSWORD_MUTATION,
        redis,
        variableValues: {
          input: {
            token: TOKEN_STRING,
            newPassword: 'NewValid@123!',
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toMatchObject({
        resetPassword: {
          user: {
            id: dbUser?.id,
            username: testUser.username,
          },
          errors: null,
        },
      });
    });

    it(`Returns field errors when token is no longer valid`, async () => {
      const TOKEN_STRING = 'token_string';
      const res = await useRequest({
        source: RESET_PASSWORD_MUTATION,
        variableValues: {
          input: {
            token: TOKEN_STRING,
            newPassword: 'NewValid@123!',
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toMatchObject({
        resetPassword: {
          user: null,
          errors: [
            {
              field: 'token',
              message: 'token expired',
            },
          ],
        },
      });
    });

    it(`Returns field errors if somehow valid token + invalid user`, async () => {
      const TOKEN_STRING = 'token_string';
      const redis = new MockRedis();
      redis.set(FORGOT_PASS_PREFIX + TOKEN_STRING, '5fcfa2af939b6a0fe53c1a56'); //invalid id
      const res = await useRequest({
        source: RESET_PASSWORD_MUTATION,
        redis: redis,
        variableValues: {
          input: {
            token: TOKEN_STRING,
            newPassword: 'NewValid@123!',
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toMatchObject({
        resetPassword: {
          user: null,
          errors: [
            {
              field: 'token',
              message: 'user no longer exists',
            },
          ],
        },
      });
    });
  });

  describe('Query -> Me', () => {
    it(`Returns current user info when active session`, async () => {
      const testUser = getValidUser();
      const dbUser = await new UserModel(testUser).save();
      const res = await useRequest({
        source: ME_QUERY,
        userId: dbUser?.id,
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        me: {
          id: dbUser?.id,
          username: dbUser?.username,
          email: dbUser?.email,
        },
      });
    });

    it(`Returns null when no active session`, async () => {
      const testUser = getValidUser();
      await new UserModel(testUser).save();
      const res = await useRequest({
        source: ME_QUERY,
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data!.me).toBeNull();
    });
  });
});
