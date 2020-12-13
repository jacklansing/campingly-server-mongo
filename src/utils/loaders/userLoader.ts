import DataLoader from 'dataloader';
import { IUser } from 'src/resolvers/types/user.types';
import UserModel from '../../models/user';

const batchUsers = async (keys: readonly string[]) => {
  return UserModel.find({ _id: { $in: keys } });
};

export const createUserLoader = () =>
  new DataLoader<string, IUser>((keys) => batchUsers(keys), {
    cacheKeyFn: (key) => key.toString(),
  });
