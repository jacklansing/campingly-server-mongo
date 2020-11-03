import { ICampsite } from '../../types/campsite.types';
import UserModel from '../../../models/user';

export const manager = async (parent: ICampsite) => {
  return UserModel.findById(parent.manager);
};
