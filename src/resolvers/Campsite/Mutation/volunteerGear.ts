import { ApolloError } from 'apollo-server-express';
import { MutationVolunteerGearArgs } from '../../types/campsite.types';
import { MyContext } from '../../../types';
import CampsiteModel from '../../../models/campsite';

export const volunteerGear = async (
  _: undefined,
  {
    input: { campsiteId, gearCategoryId, gearId, volunteerAmount },
  }: MutationVolunteerGearArgs,
  { req }: MyContext,
) => {
  const campsite = await CampsiteModel.findById(campsiteId);
  if (!campsite) {
    throw new ApolloError('Could not find related campsite');
  }

  const categoryIdx = campsite.gearCategories.findIndex(
    (gc) => gc.id === gearCategoryId,
  );

  const gearIdx = campsite.gearCategories[categoryIdx].gear.findIndex(
    (g) => g.id === gearId,
  );

  if (gearIdx === -1) {
    throw new ApolloError('Could not find related gear');
  }

  const gear = campsite.gearCategories[categoryIdx].gear[gearIdx];

  const alreadyVolunteered = !!gear.volunteers.find(
    (v) => v.userId.toString() === req.session.userId,
  );

  if (alreadyVolunteered) {
    throw new ApolloError('Cannot volunteer twice');
  }

  // Calculate to the total so far so we can check if the
  // amount to volunteer is valid
  const totalVolunteered = gear.volunteers.reduce(
    (a, b) => a + b.volunteerAmount,
    0,
  );

  if (gear.quantity - totalVolunteered < volunteerAmount) {
    return {
      errors: [
        {
          field: 'volunteerAmount',
          message: 'Cannot volunteer more than needed',
        },
      ],
    };
  }

  campsite.gearCategories[categoryIdx].gear[gearIdx].volunteers.push({
    userId: req.session.userId,
    volunteerAmount,
  });

  try {
    await campsite.save();
  } catch {
    throw new ApolloError('Error saving volunteered amount');
  }

  return { campsite };
};
