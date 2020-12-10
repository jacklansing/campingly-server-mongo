import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { useRequest } from './helpers/useRequest';
import { getValidGear, getValidGearCategory } from './helpers/mocks';
import {
  addGearToCategory,
  createGearCategory,
  createTestUserWithCampsite,
} from './helpers/testHelpers';

const VOLUNTEER_GEAR_MUTATION = `
  mutation VolunteerGear($input: VolunteerGearInput!) {
    volunteerGear(input: $input) {
      campsite {
        id
        gearCategories {
          id
          gear {
            id
            quantity
            userHasVolunteered
            volunteers {
              userId
              volunteerAmount
            }
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

const UNDO_VOLUNTEER_GEAR_MUTATION = `
  mutation UndoVolunteerGear($input: UndoVolunteerGearInput!) {
    undoVolunteerGear(input: $input) {
      campsite {
        id
        gearCategories {
          id
          gear {
            id
            quantity
            userHasVolunteered
            volunteers {
              userId
              volunteerAmount
            }
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

describe('Campsite Gear Volunteer Resolvers', () => {
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

  describe('Mutation -> VolunteerGear', () => {
    it('Successfully volunteers to bring gear given valid options', async () => {
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
        source: VOLUNTEER_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            campsiteId: testCampsite.id,
            gearCategoryId: testGearCategory.id,
            gearId: testGear.id,
            volunteerAmount: gear.quantity,
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.volunteerGear).toEqual({
        campsite: {
          id: testCampsite.id,
          gearCategories: [
            {
              id: testGearCategory.id,
              gear: [
                {
                  id: testGear.id,
                  quantity: testGear.quantity,
                  userHasVolunteered: true,
                  volunteers: [
                    {
                      userId: testUser._id,
                      volunteerAmount: gear.quantity,
                    },
                  ],
                },
              ],
            },
          ],
        },
        errors: null,
      });
    });

    it('Returns field errors when volunteering more than needed', async () => {
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
        source: VOLUNTEER_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            campsiteId: testCampsite.id,
            gearCategoryId: testGearCategory.id,
            gearId: testGear.id,
            volunteerAmount: gear.quantity + 999,
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.volunteerGear).toEqual({
        campsite: null,
        errors: [
          {
            field: 'volunteerAmount',
            message: 'Cannot volunteer more than needed',
          },
        ],
      });
    });

    it('Returns an error when campsite ID invalid', async () => {
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
        source: VOLUNTEER_GEAR_MUTATION,
        userId: testUser.id,
        csid: badCampsiteId,
        variableValues: {
          input: {
            campsiteId: badCampsiteId,
            gearCategoryId: testGearCategory.id,
            gearId: testGear.id,
            volunteerAmount: gear.quantity + 999,
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.volunteerGear).toBeNull();
      expect(res.errors).toBeDefined();
      const error = res.errors![0];
      expect(error.message).toBe('Could not find related campsite');
    });

    it('Returns an error when gear ID invalid', async () => {
      const [testUser, testCampsite] = await createTestUserWithCampsite();
      const gearCategory = getValidGearCategory();
      const testGearCategory = await createGearCategory(
        gearCategory,
        testUser.id,
        testCampsite.id,
      );

      const badGearId = mongoose.Types.ObjectId();

      const res = await useRequest({
        source: VOLUNTEER_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            campsiteId: testCampsite.id,
            gearCategoryId: testGearCategory.id,
            gearId: badGearId,
            volunteerAmount: 999,
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.volunteerGear).toBeNull();
      expect(res.errors).toBeDefined();
      const error = res.errors![0];
      expect(error.message).toBe('Could not find related gear');
    });

    it('Successfully volunteers to bring gear given valid options', async () => {
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

      await useRequest({
        source: VOLUNTEER_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            campsiteId: testCampsite.id,
            gearCategoryId: testGearCategory.id,
            gearId: testGear.id,
            volunteerAmount: gear.quantity / 2,
          },
        },
      });

      const res = await useRequest({
        source: VOLUNTEER_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            campsiteId: testCampsite.id,
            gearCategoryId: testGearCategory.id,
            gearId: testGear.id,
            volunteerAmount: gear.quantity / 2,
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.volunteerGear).toBeNull();
      expect(res.errors).toBeDefined();
      const error = res.errors![0];
      expect(error.message).toBe('Cannot volunteer twice');
    });
  });

  describe('Mutation -> UndoVolunteerGear', () => {
    it('Successfully removes the volunteer given valid input', async () => {
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

      // First we'll volunteer, then remove it.
      await useRequest({
        source: VOLUNTEER_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            campsiteId: testCampsite.id,
            gearCategoryId: testGearCategory.id,
            gearId: testGear.id,
            volunteerAmount: gear.quantity,
          },
        },
      });

      const res = await useRequest({
        source: UNDO_VOLUNTEER_GEAR_MUTATION,
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
      expect(res.data?.undoVolunteerGear).toEqual({
        campsite: {
          id: testCampsite.id,
          gearCategories: [
            {
              id: testGearCategory.id,
              gear: [
                {
                  id: testGear.id,
                  quantity: testGear.quantity,
                  userHasVolunteered: false,
                  volunteers: [],
                },
              ],
            },
          ],
        },
        errors: null,
      });
    });

    it('Returns an error when campsite ID invalid', async () => {
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
        source: UNDO_VOLUNTEER_GEAR_MUTATION,
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
      expect(res.data?.undoVolunteerGear).toBeNull();
      expect(res.errors).toBeDefined();
      const error = res.errors![0];
      expect(error.message).toBe('Could not find related campsite');
    });

    it('Returns an error when gear category ID invalid', async () => {
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

      const badGearCategegoryId = mongoose.Types.ObjectId();

      const res = await useRequest({
        source: UNDO_VOLUNTEER_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            campsiteId: testCampsite.id,
            gearCategoryId: badGearCategegoryId,
            gearId: testGear.id,
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.undoVolunteerGear).toBeNull();
      expect(res.errors).toBeDefined();
      const error = res.errors![0];
      expect(error.message).toBe('Could not find related gear category');
    });

    it('Returns an error when gear ID invalid', async () => {
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
        source: UNDO_VOLUNTEER_GEAR_MUTATION,
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
      expect(res.data?.undoVolunteerGear).toBeNull();
      expect(res.errors).toBeDefined();
      const error = res.errors![0];
      expect(error.message).toBe('Could not find related gear');
    });

    it('Returns an error when volunteer to remove cannot be found', async () => {
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

      const badVolunteerId = mongoose.Types.ObjectId();

      const res = await useRequest({
        source: UNDO_VOLUNTEER_GEAR_MUTATION,
        userId: badVolunteerId,
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
      expect(res.data?.undoVolunteerGear).toBeNull();
      expect(res.errors).toBeDefined();
      const error = res.errors![0];
      expect(error.message).toBe('Could not locate volunteer to remove');
    });
  });
});
