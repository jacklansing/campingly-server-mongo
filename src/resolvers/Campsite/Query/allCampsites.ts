import { MyContext } from '../../../types';
import { ICampsite } from '../../types/campsite.types';
import UserModel from '../../../models/user';

export const allCampsites = async (
  _: undefined,
  __: undefined,
  { req }: MyContext,
): Promise<ICampsite[]> => {
  const userId = req.session.userId;
  const user = await UserModel.findById(userId)
    .populate('userCampsites', 'name startingDate endingDate')
    .populate('memberCampsites', 'name startingDate endingDate')
    .exec();
  return [
    ...((user?.userCampsites as any) as ICampsite[]),
    ...((user?.memberCampsites as any) as ICampsite[]),
  ];
};
