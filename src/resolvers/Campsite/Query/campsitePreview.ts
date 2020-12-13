import { ApolloError } from 'apollo-server-express';
import { CampsitePreview } from '../../types/campsite.types';
import CampsiteModel from '../../../models/campsite';
import { IUser } from 'src/resolvers/types/user.types';

/**
 * Originally created for the campsite invitation process, to show some details
 * about the campsite, including the manager, while making sure other information is limited.
 */
export const campsitePreview = async (
  _: undefined,
  { campsiteId }: { campsiteId: string },
): Promise<CampsitePreview> => {
  const campsite = await CampsiteModel.findById(campsiteId)
    .populate('manager')
    .exec();

  if (!campsite) {
    throw new ApolloError('Campsite not found');
  }

  return {
    name: campsite.name,
    startingDate: campsite.startingDate,
    endingDate: campsite.endingDate,
    manager: campsite.manager as IUser,
  };
};

export default campsitePreview;
