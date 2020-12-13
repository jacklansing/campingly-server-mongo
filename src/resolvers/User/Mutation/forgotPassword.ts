import { FORGOT_PASS_PREFIX } from '../../../constants';
import { MyContext } from '../../../types';
import sendForgotPasswordEmail from '../../../utils/emails/sendForgotPasswordEmail';
import { v4 } from 'uuid';
import UserModel from '../../../models/user';

export const forgotPassword = async (
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
};
