import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { useRequest } from './helpers/useRequest';
import { getValidGear, getValidGearCategory } from './helpers/mocks';
import {
  addGearToCategory,
  createGearCategory,
  createTestUserWithCampsite,
} from './helpers/testHelpers';

const ADD_GEAR_MUTATION = `
  mutation AddGear($input: AddGearInput!) {
    addGear(input: $input) {
      campsite {
        id
        gearCategories {
          id
          category
          gear {
            id
            name
            quantity
          }
        }
      }
      errors {
        field
        message
      }
    }
  }
`;

const DELETE_GEAR_MUTATION = `
  mutation DeleteGear($input: DeleteGearInput!) {
    deleteGear(input: $input) {
      campsite {
        id
        gearCategories {
          id
          category
          gear {
            id
            name
            quantity
          }
        }
      }
      errors {
        field
        message
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

  describe('Mutation -> Add Gear', () => {
    it(`Successfully adds gear given valid campsite, category, and gear details`, async () => {
      const [testUser, testCampsite] = await createTestUserWithCampsite();
      const testGearCategory = await createGearCategory(
        getValidGearCategory(),
        testUser.id,
        testCampsite.id,
      );

      const testGear = getValidGear();
      const res = await useRequest({
        source: ADD_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            ...testGear,
            campsiteId: testCampsite.id,
            gearCategoryId: testGearCategory.id,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.addGear).toEqual({
        campsite: {
          id: testCampsite.id,
          gearCategories: expect.arrayContaining([
            expect.objectContaining({
              id: testGearCategory.id,
              category: testGearCategory.category,
              gear: expect.arrayContaining([
                expect.objectContaining({
                  id: expect.any(String),
                  name: testGear.name,
                  quantity: testGear.quantity,
                }),
              ]),
            }),
          ]),
        },
        errors: null,
      });
    });

    it(`Returns a field error when gear name is less than 3 characters`, async () => {
      const [testUser, testCampsite] = await createTestUserWithCampsite();
      const testGearCategory = await createGearCategory(
        getValidGearCategory(),
        testUser.id,
        testCampsite.id,
      );

      const res = await useRequest({
        source: ADD_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            name: 'aa',
            quantity: 12,
            campsiteId: testCampsite.id,
            gearCategoryId: testGearCategory.id,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.addGear).toEqual({
        campsite: null,
        errors: [
          {
            field: 'name',
            message: 'Gear name cannot be less than 3 characters',
          },
        ],
      });
    });

    it(`Returns a field error when gear name is more than 30 characters`, async () => {
      const [testUser, testCampsite] = await createTestUserWithCampsite();
      const testGearCategory = await createGearCategory(
        getValidGearCategory(),
        testUser.id,
        testCampsite.id,
      );

      const res = await useRequest({
        source: ADD_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            name: 'aa'.repeat(16),
            quantity: 12,
            campsiteId: testCampsite.id,
            gearCategoryId: testGearCategory.id,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.addGear).toEqual({
        campsite: null,
        errors: [
          {
            field: 'name',
            message: 'Gear name cannot be more than 30 characters',
          },
        ],
      });
    });

    it(`Returns field errors when gear name is empty`, async () => {
      const [testUser, testCampsite] = await createTestUserWithCampsite();
      const testGearCategory = await createGearCategory(
        getValidGearCategory(),
        testUser.id,
        testCampsite.id,
      );

      const res = await useRequest({
        source: ADD_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            name: '',
            quantity: 12,
            campsiteId: testCampsite.id,
            gearCategoryId: testGearCategory.id,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.addGear).toEqual({
        campsite: null,
        errors: [
          {
            field: 'name',
            message: 'Gear name cannot be less than 3 characters',
          },
          {
            field: 'name',
            message: 'You must provide a label',
          },
        ],
      });
    });

    it(`Returns a field error when gear quantity is less than 1`, async () => {
      const [testUser, testCampsite] = await createTestUserWithCampsite();
      const testGearCategory = await createGearCategory(
        getValidGearCategory(),
        testUser.id,
        testCampsite.id,
      );
      const testGear = getValidGear();
      const res = await useRequest({
        source: ADD_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            ...testGear,
            quantity: 0,
            campsiteId: testCampsite.id,
            gearCategoryId: testGearCategory.id,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.addGear).toEqual({
        campsite: null,
        errors: [
          {
            field: 'quantity',
            message: 'Quantity cannot be less than 1',
          },
        ],
      });
    });

    it(`Returns a field error when gear quantity is more than 99`, async () => {
      const [testUser, testCampsite] = await createTestUserWithCampsite();
      const testGearCategory = await createGearCategory(
        getValidGearCategory(),
        testUser.id,
        testCampsite.id,
      );
      const testGear = getValidGear();
      const res = await useRequest({
        source: ADD_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            ...testGear,
            quantity: 100,
            campsiteId: testCampsite.id,
            gearCategoryId: testGearCategory.id,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.addGear).toEqual({
        campsite: null,
        errors: [
          {
            field: 'quantity',
            message: 'Quantity cannot be more than 99',
          },
        ],
      });
    });

    it(`Returns error when given invalid gear category ID`, async () => {
      const [testUser, testCampsite] = await createTestUserWithCampsite();

      const testGear = getValidGear();
      const res = await useRequest({
        source: ADD_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            ...testGear,
            campsiteId: testCampsite.id,
            gearCategoryId: mongoose.Types.ObjectId(),
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data?.addGear).toBeNull();
      expect(res.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: 'Category does not exist' }),
        ]),
      );
    });
  });
  describe('Mutation -> Delete Gear', () => {
    it(`Successfully deletes gear given valid input`, async () => {
      const [testUser, testCampsite] = await createTestUserWithCampsite();
      const gearCategory = getValidGearCategory();
      const testGearCategory = await createGearCategory(
        gearCategory,
        testUser.id,
        testCampsite.id,
      );

      const gear = getValidGear();

      const testGear = await addGearToCategory(
        testCampsite.id,
        testGearCategory.id!,
        gear.name,
        gear.quantity,
      );

      const res = await useRequest({
        source: DELETE_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            campsiteId: testCampsite.id,
            gearCategoryId: testGearCategory.id,
            gearId: testGear.id,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.deleteGear).toEqual({
        campsite: {
          id: testCampsite.id,
          gearCategories: [
            {
              id: testGearCategory.id,
              category: testGearCategory.category,
              gear: [],
            },
          ],
        },
        errors: null,
      });
    });

    it(`Returns field errors when campsite ID invalid`, async () => {
      const [testUser, testCampsite] = await createTestUserWithCampsite();
      const gearCategory = getValidGearCategory();
      const testGearCategory = await createGearCategory(
        gearCategory,
        testUser.id,
        testCampsite.id,
      );

      const gear = getValidGear();

      const testGear = await addGearToCategory(
        testCampsite.id,
        testGearCategory.id!,
        gear.name,
        gear.quantity,
      );

      const badCampsiteId = mongoose.Types.ObjectId();

      const res = await useRequest({
        source: DELETE_GEAR_MUTATION,
        userId: testUser.id,
        csid: badCampsiteId,
        variableValues: {
          input: {
            campsiteId: badCampsiteId,
            gearCategoryId: testGearCategory.id,
            gearId: testGear.id,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.deleteGear).toBeNull();
      expect(res.errors).toBeDefined();
      const error = res.errors![0];
      expect(error.message).toBe('Could not find related campsite');
    });

    it(`Returns field errors when gear category ID invalid`, async () => {
      const [testUser, testCampsite] = await createTestUserWithCampsite();
      const gearCategory = getValidGearCategory();
      const testGearCategory = await createGearCategory(
        gearCategory,
        testUser.id,
        testCampsite.id,
      );

      const gear = getValidGear();

      const testGear = await addGearToCategory(
        testCampsite.id,
        testGearCategory.id!,
        gear.name,
        gear.quantity,
      );

      const badGearCategoryId = mongoose.Types.ObjectId();

      const res = await useRequest({
        source: DELETE_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            campsiteId: testCampsite.id,
            gearCategoryId: badGearCategoryId,
            gearId: testGear.id,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.deleteGear).toBeNull();
      expect(res.errors).toBeDefined();
      const error = res.errors![0];
      expect(error.message).toBe('Could not find related gear category');
    });

    it(`Returns field errors when gear ID invalid`, async () => {
      const [testUser, testCampsite] = await createTestUserWithCampsite();
      const gearCategory = getValidGearCategory();
      const testGearCategory = await createGearCategory(
        gearCategory,
        testUser.id,
        testCampsite.id,
      );

      const gear = getValidGear();

      await addGearToCategory(
        testCampsite.id,
        testGearCategory.id!,
        gear.name,
        gear.quantity,
      );

      const badGearId = mongoose.Types.ObjectId();

      const res = await useRequest({
        source: DELETE_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            campsiteId: testCampsite.id,
            gearCategoryId: testGearCategory.id,
            gearId: badGearId,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.deleteGear).toBeNull();
      expect(res.errors).toBeDefined();
      const error = res.errors![0];
      expect(error.message).toBe('Could not find related gear');
    });
  });
});
