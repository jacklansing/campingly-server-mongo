import { ApolloError } from 'apollo-server-express';
import {
  MutationUndoVolunteerGearArgs,
  CampsiteResponse,
} from '../../types/campsite.types';
import { MyContext } from '../../../types';
import CampsiteModel from '../../../models/campsite';

export const undoVolunteerGear = async (
  _: undefined,
  {
    input: { campsiteId, gearCategoryId, gearId },
  }: MutationUndoVolunteerGearArgs,
  { req }: MyContext,
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

  const volunteerIdx = campsite.gearCategories[categoryIdx].gear[
    gearIdx
  ].volunteers.findIndex((v) => v.userId.toString() === req.session.userId);

  if (volunteerIdx === -1) {
    throw new ApolloError('Could not locate volunteer to remove');
  }

  campsite.gearCategories[categoryIdx].gear[gearIdx].volunteers.splice(
    volunteerIdx,
    1,
  );

  try {
    await campsite.save();
  } catch {
    throw new ApolloError('Error saving changes to campsite');
  }
  return { campsite };
};
