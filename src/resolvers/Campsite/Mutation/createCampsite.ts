import { ApolloError } from 'apollo-server-express';
import {
  MutationCreateCampsiteArgs,
  CampsiteResponse,
} from '../../types/campsite.types';
import { MyContext } from '../../../types';
import { NewCampsiteSchema } from '../../../utils/validators/CampsiteSchema';
import { useValidationSchema } from '../../../utils/validators/useValidationSchema';
import CampsiteModel from '../../../models/campsite';
import UserModel from '../../../models/user';

export const createCampsite = async (
  _: undefined,
  { input }: MutationCreateCampsiteArgs,
  { req }: MyContext,
): Promise<CampsiteResponse> => {
  const alreadyUsed = await CampsiteModel.findOne({
    name: input.name as string,
    managerId: req.session.userId,
  }).exec();

  if (alreadyUsed) {
    return {
      errors: [
        {
          field: 'name',
          message: 'You already have a campsite with this name',
        },
      ],
    };
  }

  const { errors } = await useValidationSchema(input, NewCampsiteSchema);
  if (errors) return { errors };

  const manager = await UserModel.findOne({
    _id: req.session.userId,
  }).exec();
  if (!manager) {
    throw new ApolloError('Error retrieving current user info');
  }

  const campsite = new CampsiteModel({
    name: input.name,
    startingDate: new Date(input.startingDate),
    endingDate: new Date(input.endingDate),
    manager: manager._id,
  });

  try {
    await campsite.save();
  } catch {
    console.error('Error inserting new campsite');
  }

  if (!campsite.id) {
    throw new ApolloError('There was an error saving the new campsite');
  }

  manager.userCampsites.push(campsite.id);
  try {
    await manager.save();
  } catch {
    throw new ApolloError('There was an error saving the campsite to the User');
  }
  await campsite
    .populate('manager')
    .populate('counselors')
    .populate('campers')
    .execPopulate();
  return { campsite };
};
