import argon2 from 'argon2';
import { MyContext } from 'src/types';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from 'type-graphql';
import { v4 } from 'uuid';
import { COOKIE_NAME, FORGOT_PASS_PREFIX } from '../constants';
import { User } from '../entities/User';
import sendForgotPasswordEmail from '../utils/sendForgotPasswordEmail';
import {
  PasswordResetSchema,
  RegisterSchema,
} from '../utils/validators/UserSchemas';
import { useValidationSchema } from '../utils/validators/useValidationSchema';
import { UsernamePasswordInput } from './UsernamePasswordInput';

@ObjectType()
export class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@ObjectType()
class ErrorMessage {
  @Field(() => String)
  message: string;
}

@ObjectType()
class LogoutError {
  @Field(() => String, { nullable: true })
  errors?: ErrorMessage[];
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    // Okay to show user their own email
    if (req.session.userId === user.id) {
      return user.email;
    }
    // Hide e-mail when not that user
    return '';
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    // If you are not logged in, receive null
    if (!req.session.userId) {
      return null;
    }

    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('input', () => UsernamePasswordInput) input: UsernamePasswordInput,
    @Ctx() { req }: MyContext,
  ): Promise<UserResponse> {
    const { errors } = await useValidationSchema(input, RegisterSchema);
    if (errors) return { errors };

    // Check to see if username is already taken
    const usernameTaken = await User.findOne({
      where: { username: input.username },
    });
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

    const emailTaken = await User.findOne({
      where: { email: input.email },
    });

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
    const user = await User.create({
      username: input.username,
      password: hashedPassword,
      email: input.email,
    });
    try {
      // Save user to database
      await user.save();
    } catch {
      console.error('error inserting new user');
    }
    // store user id session
    // set a cookie on the user and keep them logged in
    req.session.userId = user.id;
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { req }: MyContext,
  ): Promise<UserResponse> {
    const user = await User.findOne({
      where: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
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
    return {
      user,
    };
  }

  @Mutation(() => UserResponse)
  async logout(@Ctx() { req, res }: MyContext): Promise<User | LogoutError> {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          resolve({
            errors: [
              {
                message: 'There was an error logging out',
              },
            ],
          });
        }
        resolve({});
      }),
    );
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis, req }: MyContext,
  ): Promise<UserResponse> {
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
    const userIdNum = parseInt(userId);
    const user = await User.findOne(userIdNum);

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
    await User.update({ id: userIdNum }, { password: hashedPassword });
    // Delete token so that it cannot be reused after pw change
    await redis.del(redisKey);
    // Login user after change password (optional)
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { redis }: MyContext,
  ) {
    const user = await User.findOne({ where: { email } });
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
  }
}
