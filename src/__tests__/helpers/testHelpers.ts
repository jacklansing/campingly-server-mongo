import { UsernamePasswordInput } from '../../resolvers/UsernamePasswordInput';
import { Campsite } from '../../entities/Campsite';
import { CampsiteInput } from '../../resolvers/campsite';
import { CREATE_CAMPSITE_MUTATION } from '../campsite.spec';
import { useRequest } from './useRequest';
import { User } from '../../entities/User';

export const createCampsite = async (
  campsite: CampsiteInput,
  userId: number,
): Promise<Campsite> => {
  await useRequest({
    source: CREATE_CAMPSITE_MUTATION,
    variableValues: {
      input: {
        ...campsite,
      },
    },
    userId: userId,
  });

  const created = await Campsite.findOneOrFail({
    where: { name: campsite.name, counselorId: userId },
  });

  created.startingDate = created.startingDate.toISOString() as any;
  created.endingDate = created.endingDate.toISOString() as any;

  return created;
};

export const createUser = async (user: UsernamePasswordInput) => {
  await User.insert(user);
  return User.findOneOrFail({ where: { username: user.username } });
};
