import Schema from 'mongoose';
import {
  MutationCreateCampsiteArgs,
  ICampsiteDocument,
  IGearCategory,
} from '../../resolvers/types/campsite.types';
import { CREATE_CAMPSITE_MUTATION } from '../campsite.spec';
import { useRequest } from './useRequest';
import CampsiteModel from '../../models/campsite';
import { CREATE_GEAR_CATEGORY_MUTATION } from '../campsite.gear-categories.spec';

/**
 * For testing purposes. Create a new campsite.
 * @param campsite The campsite input.
 * @param userId The user the campsite should belong to.
 */
export const createCampsite = async (
  campsite: MutationCreateCampsiteArgs,
  userId: Schema.Types.ObjectId,
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

/**
 * For testing purposes. Create a new gear category for a campsite.
 * @param categoryName The name of the cateogry to add.
 * @param userId The ID of the user who owns the campsite.
 * @param campsiteId The ID of the campsite to add it to.
 */
export const createGearCategory = async (
  categoryName: string,
  userId: Schema.Types.ObjectId,
  campsiteId: Schema.Types.ObjectId,
): Promise<IGearCategory> => {
  await useRequest({
    source: CREATE_GEAR_CATEGORY_MUTATION,
    userId,
    csid: campsiteId,
    variableValues: {
      input: {
        category: categoryName,
        campsiteId,
      },
    },
  });

  const created = await CampsiteModel.findById(campsiteId);

  if (!created) throw new Error('Could not locate campsite');

  return created.gearCategories[0];
};
