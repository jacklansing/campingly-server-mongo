import { MyContext } from '../../../types';
import UserModel from '../../../models/user';

export const me = async (_: undefined, __: {}, { req }: MyContext) => {
  if (!req.session.userId) {
    return null;
  }

  // return UserModel.findById(req.session.userId).exec();
  const user = await UserModel.findById(req.session.userId)
    .populate('campsites')
    .exec();
  return user;
};
