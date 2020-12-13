import { ICampsite } from '../../types/campsite.types';
import { MyContext } from 'src/types';

export const manager = async (
  parent: ICampsite,
  _: any,
  { userLoader }: MyContext,
) => {
  return userLoader.load(parent.manager.toString());
};
