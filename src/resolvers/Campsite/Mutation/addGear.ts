import { ApolloError } from 'apollo-server-express';
import {
  MutationAddGearArgs,
  CampsiteResponse,
} from '../../types/campsite.types';
import { AddGearSchema } from '../../../utils/validators/GearSchemas';
import { useValidationSchema } from '../../../utils/validators/useValidationSchema';
import CampsiteModel from '../../../models/campsite';

export const addGear = async (
  _: undefined,
  { input }: MutationAddGearArgs,
): Promise<CampsiteResponse> => {
  const { errors } = await useValidationSchema(input, AddGearSchema);

  if (errors) return { errors };

  const campsite = await CampsiteModel.findById(input.campsiteId);

  if (!campsite) {
    throw new ApolloError('Could not find related campsite');
  }

  const categoryIdx = campsite.gearCategories.findIndex(
    (gc) => gc.id === input.gearCategoryId,
  );

  if (categoryIdx === -1) throw new ApolloError('Category does not exist');

  const alreadyUsed = campsite.gearCategories[categoryIdx].gear.find(
    (g) => g.name.toLowerCase() === input.name.toLowerCase(),
  );

  if (alreadyUsed) {
    return {
      errors: [
        {
          field: 'name',
          message: 'Name is already in use for this category',
        },
      ],
    };
  }

  // Add gear to category
  campsite.gearCategories[categoryIdx].gear.push({
    name: input.name,
    quantity: input.quantity,
    volunteers: [],
  });

  try {
    await campsite.save();
  } catch (e) {
    throw new ApolloError('There was an error saving the new gear to campsite');
  }

  return { campsite };
};
