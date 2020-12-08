import {
  MutationCreateCampsiteArgs,
  ICampsiteDocument,
} from '../../resolvers/types/campsite.types';
import { CREATE_CAMPSITE_MUTATION } from '../campsite.spec';
import { useRequest } from './useRequest';
import CampsiteModel from '../../models/campsite';

export const createCampsite = async (
  campsite: MutationCreateCampsiteArgs,
  userId: string,
): Promise<ICampsiteDocument> => {
  await useRequest({
    source: CREATE_CAMPSITE_MUTATION,
    variableValues: {
      ...campsite,
    },
    userId: userId,
  });

  const created = await CampsiteModel.findOne({
    name: campsite.input.name,
    manager: userId,
  });

  if (!created) throw new Error('Could not locate created campsite');

  created.startingDate = created.startingDate.toISOString() as any;
  created.endingDate = created.endingDate.toISOString() as any;

  return created;
};
