import { MyContext } from '../../../types';
import { ICampsite } from '../../../resolvers/types/campsite.types';

export const counselors = async (
  parent: ICampsite,
  _: any,
  { userLoader }: MyContext,
) => {
  return parent.counselors.length === 0
    ? []
    : // @ts-expect-error
      userLoader.loadMany(parent.counselors);
};
