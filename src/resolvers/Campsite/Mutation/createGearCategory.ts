import { ApolloError } from 'apollo-server-express';
import {
  MutationCreateGearCategoryArgs,
  CampsiteResponse,
} from '../../types/campsite.types';
import { NewGearCategorySchema } from '../../../utils/validators/GearCategorySchema';
import { useValidationSchema } from '../../../utils/validators/useValidationSchema';
import CampsiteModel from '../../../models/campsite';

export const createGearCategory = async (
  _: undefined,
  { input: { category, campsiteId } }: MutationCreateGearCategoryArgs,
): Promise<CampsiteResponse> => {
  const campsite = await CampsiteModel.findById(campsiteId);
  if (!campsite) {
    throw new ApolloError('Invalid Campsite');
  }

  const { errors } = await useValidationSchema(
    { category },
    NewGearCategorySchema,
  );
  if (errors) return { errors };

  const alreadyUsed = campsite.gearCategories.find(
    (gc) => gc.category.toLowerCase() === category.toLowerCase(),
  );

  if (alreadyUsed) {
    return {
      errors: [
        {
          field: 'category',
          message: 'There is already a category with this name',
        },
      ],
    };
  }

  // Add new category to campsite
  campsite.gearCategories.push({ category, gear: [] });

  try {
    await campsite.save();
  } catch (e) {
    console.error('There was an error saving the new category', e);
  }

  return { campsite };
};
