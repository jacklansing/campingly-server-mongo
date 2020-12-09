import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { useRequest } from './helpers/useRequest';
import {
  getAllValidGearCategories,
  getValidCampsite,
  getValidGearCategory,
  getValidUser,
} from './helpers/mocks';
import UserModel from '../models/user';
import { createCampsite } from './helpers/testHelpers';

export const CREATE_GEAR_CATEGORY_MUTATION = `
  mutation CreateGearCategory($input: CreateGearCategoryInput!) {
    createGearCategory(input: $input) {
      campsite {
          id
          gearCategories {
              id
              category
          }
      }
      errors {
        field
        message
      }
    }
  }
`;

const GET_CAMPSITE_QUERY = `
query GetCampsite($campsiteId: String!){
  getCampsite(campsiteId: $campsiteId) {
        id
        gearCategories {
            id
            category
        }
    }
}
`;

const mongod = new MongoMemoryServer();

describe('Campsite Gear Category Resolvers', () => {
  beforeAll(async () => {
    const uri = await mongod.getUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
  });

  afterEach(async () => {
    await mongoose.connection.collection('users').deleteMany({});
    await mongoose.connection.collection('campsites').deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
  });

  describe(`Mutation -> Create Gear Category`, () => {
    it(`Successfully creates a new category when campsite and category name are valid`, async () => {
      const testCategory = getValidGearCategory();
      const testUser = await new UserModel(getValidUser()).save();
      const testCampsite = await createCampsite(
        { input: getValidCampsite() },
        testUser.id,
      );

      const res = await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          input: {
            category: testCategory,
            campsiteId: testCampsite.id,
          },
        },
        csid: testCampsite.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.createGearCategory).toEqual({
        campsite: {
          id: testCampsite.id,
          gearCategories: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              category: testCategory,
            }),
          ]),
        },
        errors: null,
      });
    });

    it(`Returns field errors when category name is less than 3 characters`, async () => {
      const testUser = await new UserModel(getValidUser()).save();
      const testCampsite = await createCampsite(
        { input: getValidCampsite() },
        testUser.id,
      );

      const res = await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          input: {
            category: 'hi',
            campsiteId: testCampsite.id,
          },
        },
        csid: testCampsite.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.createGearCategory).toEqual({
        campsite: null,
        errors: [
          {
            field: 'category',
            message: 'Category name cannot be less than 3 characters',
          },
        ],
      });
    });

    it(`Returns field errors when category name more than 30 characters`, async () => {
      const testUser = await new UserModel(getValidUser()).save();
      const testCampsite = await createCampsite(
        { input: getValidCampsite() },
        testUser.id,
      );

      const res = await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          input: {
            category: 'hi'.repeat(16),
            campsiteId: testCampsite.id,
          },
        },
        csid: testCampsite.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.createGearCategory).toEqual({
        campsite: null,
        errors: [
          {
            field: 'category',
            message: 'Category name cannot be more than 30 characters',
          },
        ],
      });
    });

    it(`Returns field errors when category name is empty`, async () => {
      const testUser = await new UserModel(getValidUser()).save();
      const testCampsite = await createCampsite(
        { input: getValidCampsite() },
        testUser.id,
      );

      const res = await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          input: {
            category: '',
            campsiteId: testCampsite.id,
          },
        },
        csid: testCampsite.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.createGearCategory).toEqual({
        campsite: null,
        errors: [
          {
            field: 'category',
            message: 'Category name cannot be less than 3 characters',
          },
          {
            field: 'category',
            message: 'You must provide a category name',
          },
        ],
      });
    });

    it(`Returns field errors when category name is already in use at that campsite`, async () => {
      const testCategory = getValidGearCategory();
      const testUser = await new UserModel(getValidUser()).save();
      const testCampsite = await createCampsite(
        { input: getValidCampsite() },
        testUser.id,
      );

      await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          input: {
            category: testCategory,
            campsiteId: testCampsite.id,
          },
        },
        csid: testCampsite.id,
      });

      const res = await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          input: {
            category: testCategory,
            campsiteId: testCampsite.id,
          },
        },
        csid: testCampsite.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.createGearCategory).toEqual({
        campsite: null,
        errors: [
          {
            field: 'category',
            message: 'There is already a category with this name',
          },
        ],
      });
    });

    it(`Throws an error when target campsite id does not exist`, async () => {
      const testCategory = getValidGearCategory();
      const testUser = await new UserModel(getValidUser()).save();
      const testCampsite = await createCampsite(
        { input: getValidCampsite() },
        testUser.id,
      );

      const res = await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          input: {
            category: testCategory,
            campsiteId: mongoose.Types.ObjectId(),
          },
        },
        csid: testCampsite.id,
      });

      expect(res).toBeDefined();
      expect(res.data?.createGearCategory).toBeNull();
      expect(res.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: 'Invalid Campsite' }),
        ]),
      );
    });
  });

  describe(`Query -> Get Campsite With Gear Categories`, () => {
    it(`Returns all of the gear categories for a campsite`, async () => {
      const testCategories = getAllValidGearCategories();
      const testUser = await new UserModel(getValidUser()).save();
      const testCampsite = await createCampsite(
        { input: getValidCampsite() },
        testUser.id,
      );

      await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          input: {
            category: testCategories[0],
            campsiteId: testCampsite.id,
          },
        },
        csid: testCampsite.id,
      });

      await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          input: {
            category: testCategories[1],
            campsiteId: testCampsite.id,
          },
        },
        csid: testCampsite.id,
      });

      const res = await useRequest({
        source: GET_CAMPSITE_QUERY,
        userId: testUser.id,
        variableValues: {
          campsiteId: testCampsite.id,
        },
        csid: testCampsite.id,
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.getCampsite.gearCategories.length).toBe(2);
      expect(res.data?.getCampsite.gearCategories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ category: testCategories[0] }),
          expect.objectContaining({ category: testCategories[1] }),
        ]),
      );
    });

    it(`Returns an empty array when no categories exist for the campsite`, async () => {
      const testUser = await new UserModel(getValidUser()).save();
      const testCampsite = await createCampsite(
        { input: getValidCampsite() },
        testUser.id,
      );

      const res = await useRequest({
        source: GET_CAMPSITE_QUERY,
        userId: testUser.id,
        variableValues: {
          campsiteId: testCampsite.id,
        },
        csid: testCampsite.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.getCampsite.gearCategories).toStrictEqual([]);
      expect(res.data?.getCampsite.gearCategories.length).toBe(0);
    });
  });
});
