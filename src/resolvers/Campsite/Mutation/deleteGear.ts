import { ApolloError } from 'apollo-server-express';
import {
  MutationDeleteGearArgs,
  CampsiteResponse,
} from '../../types/campsite.types';
import CampsiteModel from '../../../models/campsite';

export const deleteGear = async (
  _: undefined,
  { input: { campsiteId, gearCategoryId, gearId } }: MutationDeleteGearArgs,
): Promise<CampsiteResponse> => {
  const campsite = await CampsiteModel.findById(campsiteId);
  if (!campsite) {
    throw new ApolloError('Could not find related campsite');
  }

  const categoryIdx = campsite.gearCategories.findIndex(
    (gc) => gc.id === gearCategoryId,
  );

  if (categoryIdx === -1) {
    throw new ApolloError('Could not find related gear category');
  }

  const gearIdx = campsite.gearCategories[categoryIdx].gear.findIndex(
    (g) => g.id === gearId,
  );

  if (gearIdx === -1) {
    throw new ApolloError('Could not find related gear');
  }

  campsite.gearCategories[categoryIdx].gear.splice(gearIdx, 1);

  try {
    await campsite.save();
  } catch {
    throw new ApolloError('Error removing gear from campsite');
  }

  return { campsite };
};
