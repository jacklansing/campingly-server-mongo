import { ApolloError } from 'apollo-server-express';
import CampsiteModel from '../models/campsite';
import UserModel from '../models/user';
import { MyContext } from '../types';
import { useValidationSchema } from '../utils/validators/useValidationSchema';
import { NewCampsiteSchema } from '../utils/validators/CampsiteSchema';
import {
  CampsiteResponse,
  ICampsite,
  ICampsiteDocument,
  IGear,
  MutationAddGearArgs,
  MutationCreateCampsiteArgs,
  MutationCreateGearCategoryArgs,
  MutationDeleteGearArgs,
  MutationUndoVolunteerGearArgs,
  MutationVolunteerGearArgs,
} from './types/campsite.types';
import { NewGearCategorySchema } from '../utils/validators/GearCategorySchema';
import { AddGearSchema } from '../utils/validators/GearSchemas';

//TODO: Refactor into separate resolvers
//TODO: Refactor repetitious gear category & gear logic
//TODO: Finish up field resolvers for Campsite

export default {
  Query: {
    getCampsite: async (
      _: undefined,
      { campsiteId }: { campsiteId: string },
    ): Promise<ICampsiteDocument> => {
      const campsite = await CampsiteModel.findById(campsiteId)
        .populate('manager')
        .populate('counselors')
        .populate('campsers')
        .populate('gearCategories')
        .exec();

      if (!campsite) {
        throw new ApolloError('Campsite not found');
      }

      return campsite;
    },
    allCampsites: async (
      _: undefined,
      __: undefined,
      { req }: MyContext,
    ): Promise<ICampsite[]> => {
      const userId = req.session.userId;
      const user = await UserModel.findById(userId)
        .populate('userCampsites', 'name startingDate endingDate')
        .populate('memberCampsites', 'name startingDate endingDate')
        .exec();
      return [
        ...((user?.userCampsites as any) as ICampsite[]),
        ...((user?.memberCampsites as any) as ICampsite[]),
      ];
    },
    myCampsites: async (
      _: undefined,
      __: undefined,
      { req }: MyContext,
    ): Promise<ICampsite[]> => {
      const userId = req.session.userId;
      const user = await UserModel.findById(userId)
        .populate('userCampsites')
        .exec();
      return (user?.userCampsites as any) as ICampsite[];
    },
  },
  Mutation: {
    createCampsite: async (
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
        throw new ApolloError(
          'There was an error saving the campsite to the User',
        );
      }
      await campsite
        .populate('manager')
        .populate('counselors')
        .populate('campers')
        .execPopulate();
      return { campsite };
    },
    createGearCategory: async (
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
    },
    addGear: async (
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
        throw new ApolloError(
          'There was an error saving the new gear to campsite',
        );
      }

      return { campsite };
    },
    deleteGear: async (
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
    },
    volunteerGear: async (
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
    },
    undoVolunteerGear: async (
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
    },
  },
  Campsite: {
    manager: async (parent: ICampsite) => {
      return UserModel.findById(parent.manager);
    },
  },
  Gear: {
    userHasVolunteered: async (parent: IGear, _: any, { req }: MyContext) => {
      return !!parent.volunteers.find(
        (v) => v.userId.toString() === req.session.userId,
      );
    },
  },
};
