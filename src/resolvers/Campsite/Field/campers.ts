import { MyContext } from '../../../types';
import { ICampsite } from '../../../resolvers/types/campsite.types';

export const campers = async (
  parent: ICampsite,
  _: any,
  { userLoader }: MyContext,
) => {
  // @ts-expect-error
  return parent.campers.length === 0 ? [] : userLoader.loadMany(parent.campers);
};
