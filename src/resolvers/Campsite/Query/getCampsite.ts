import { ApolloError } from 'apollo-server-express';
import { ICampsiteDocument } from '../../types/campsite.types';
import CampsiteModel from '../../../models/campsite';

export const getCampsite = async (
  _: undefined,
  { campsiteId }: { campsiteId: string },
): Promise<ICampsiteDocument> => {
  const campsite = await CampsiteModel.findById(campsiteId)
    .populate('gearCategories')
    .exec();
  console.log('campsite', campsite);
  if (!campsite) {
    throw new ApolloError('Campsite not found');
  }

  return campsite;
};

export default getCampsite;
