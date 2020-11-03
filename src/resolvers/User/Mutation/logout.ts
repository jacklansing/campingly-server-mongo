import { COOKIE_NAME } from '../../../constants';
import { LogoutResponse } from '../../../resolvers/types/user.types';
import { MyContext } from '../../../types';

export const logout = async (
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
};
