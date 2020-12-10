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
import { getValidCampsite, getValidUser } from './mocks';
import UserModel from '../../models/user';
import { IUserDocument } from '../../resolvers/types/user.types';

/**
 * For testing purposes. Create a new campsite.
 * @param campsite The campsite input.
 * @param userId The user the campsite should belong to.
 * @returns Promise with the created Campsite.
 */
export const createCampsite = async (
  campsite: MutationCreateCampsiteArgs,
  userId: Schema.Types.ObjectId,
): Promise<ICampsiteDocument> => {
  try {
    await useRequest({
      source: CREATE_CAMPSITE_MUTATION,
      variableValues: {
        ...campsite,
      },
      userId: userId,
    });
  } catch {
    throw new Error('Error creating test campsite');
  }

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
 * @returns Promise with created gear category.
 */
export const createGearCategory = async (
  categoryName: string,
  userId: Schema.Types.ObjectId,
  campsiteId: Schema.Types.ObjectId,
): Promise<IGearCategory> => {
  try {
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
  } catch {
    throw new Error('Error creating test gear category');
  }

  const created = await CampsiteModel.findById(campsiteId);

  if (!created) throw new Error('Could not locate campsite');

  return created.gearCategories[0];
};

/**
 * For testing purposes. Creates a user along with a campsite that user is the manager of.
 * @returns Promise with tuple [ testUser, testCampsite ]
 */
export const createTestUserWithCampsite = async (): Promise<
  [IUserDocument, ICampsiteDocument]
> => {
  const validUser = getValidUser();
  const testUser = await new UserModel(validUser).save();
  const testCampsite = await createCampsite(
    { input: getValidCampsite() },
    testUser.id,
  );

  return [testUser, testCampsite];
};

/**
 * For testing purposes. Add required gear to a specific gear category.
 * @param campsiteId The ID of the campsite.
 * @param gearCategoryId The ID of the gear category.
 * @param gearName The name of the gear to add.
 * @param gearQuantity The quantity of gear needed.
 * @returns Promise with the added gear.
 */
export const addGearToCategory = async (
  campsiteId: Schema.Types.ObjectId,
  gearCategoryId: Schema.Types.ObjectId,
  gearName: string,
  gearQuantity: number,
) => {
  let campsite = await CampsiteModel.findById(campsiteId);

  if (!campsite)
    throw new Error(`Could not find campsite with id ${campsiteId}`);

  const gearCategoryIdx = campsite?.gearCategories.findIndex(
    (gc) => gc.id === gearCategoryId,
  );

  if (gearCategoryIdx === -1)
    throw new Error(`Could not find gear category with id ${gearCategoryId}`);

  campsite?.gearCategories[gearCategoryIdx as number].gear.push({
    name: gearName,
    quantity: gearQuantity,
    volunteers: [],
  });

  campsite = await campsite?.save();

  const testGear = campsite.gearCategories[gearCategoryIdx].gear[0];

  return testGear;
};
