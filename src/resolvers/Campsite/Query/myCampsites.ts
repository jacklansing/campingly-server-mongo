import { ICampsite } from '../../types/campsite.types';
import { MyContext } from '../../../types';
import UserModel from '../../../models/user';

export const myCampsites = async (
  _: undefined,
  __: undefined,
  { req }: MyContext,
): Promise<ICampsite[]> => {
  const userId = req.session.userId;
  const user = await UserModel.findById(userId)
    .populate('userCampsites')
    .exec();
  return (user?.userCampsites as any) as ICampsite[];
};

export default myCampsites;
