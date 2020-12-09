import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { useRequest } from './helpers/useRequest';
import {
  getAllValidCampsites,
  getAllValidUsers,
  getValidCampsite,
  getValidUser,
} from './helpers/mocks';
import UserModel from '../models/user';
import CampsiteModel from '../models/campsite';
import { createCampsite } from './helpers/testHelpers';

export const CREATE_CAMPSITE_MUTATION = `
  mutation CreateCampsite($input: CreateCampsiteInput!) {
    createCampsite(input: $input) {
      campsite {
        id
        name
        startingDate
        endingDate
      }
      errors {
        field
        message
      }
    }
  }
`;

const ALL_CAMPSITES_QUERY = `
  query {
    allCampsites {
      id
      name
      startingDate
      endingDate
    }
  }
`;

const MY_CAMPSITES_QUERY = `
  query {
    myCampsites {
      id
      name
      startingDate
      endingDate
    }
  }
`;

const GET_CAMPSITE_QUERY = `
  query GetCampsite($campsiteId: String!) {
    getCampsite(campsiteId: $campsiteId) {
      id
      name
      startingDate
      endingDate
    }
  }
`;

const mongod = new MongoMemoryServer();

describe('Campsite Resolver', () => {
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

  describe('Mutation -> Create Campsite', () => {
    it(`Requires you to be logged in`, async () => {
      const newCampsite = getValidCampsite();
      const res = await useRequest({
        source: CREATE_CAMPSITE_MUTATION,
        variableValues: {
          input: {
            ...newCampsite,
          },
        },
      });
      expect(res).toBeDefined();
      expect(res.data?.createCampsite).toBeNull();
      expect(res.errors).toBeDefined();
      const error = res.errors![0];
      expect(error.message).toBe('Error retrieving current user info');
    });

    it(`Successfully creates campsite when logged in and valid campsite`, async () => {
      const testUser = getValidUser();
      const testCampsite = getValidCampsite();
      const createdUser = await new UserModel(testUser).save();
      const res = await useRequest({
        source: CREATE_CAMPSITE_MUTATION,
        variableValues: {
          input: {
            ...testCampsite,
          },
        },
        userId: createdUser.id,
      });

      const createdCampsite = await CampsiteModel.findOne({
        manager: createdUser.id,
        name: testCampsite.name,
      });

      expect(res).toBeDefined();
      expect(res.data?.createCampsite.campsite).toMatchObject({
        id: createdCampsite?.id,
        name: createdCampsite?.name,
        startingDate: createdCampsite?.startingDate,
        endingDate: createdCampsite?.endingDate,
      });
    });

    it(`Returns field error when user already has campsite using same name`, async () => {
      const testUser = getValidUser();
      const createdUser = await new UserModel(testUser).save();
      const newCampsite = getValidCampsite();
      await useRequest({
        source: CREATE_CAMPSITE_MUTATION,
        variableValues: {
          input: {
            ...newCampsite,
          },
        },
        userId: createdUser.id,
      });

      const res = await useRequest({
        source: CREATE_CAMPSITE_MUTATION,
        variableValues: {
          input: {
            ...newCampsite,
          },
        },
        userId: createdUser.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        createCampsite: {
          campsite: null,
          errors: [
            {
              field: 'name',
              message: 'You already have a campsite with this name',
            },
          ],
        },
      });
    });

    it(`Returns field errors when campsite name is less than 3 characters`, async () => {
      const testUser = getValidUser();
      const createdUser = await new UserModel(testUser).save();
      const newCampsite = getValidCampsite();
      newCampsite['name'] = 'ab';
      const res = await useRequest({
        source: CREATE_CAMPSITE_MUTATION,
        variableValues: {
          input: {
            ...newCampsite,
          },
        },
        userId: createdUser.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        createCampsite: {
          campsite: null,
          errors: [
            {
              field: 'name',
              message: 'Campsite name cannot be less than 3 characters',
            },
          ],
        },
      });
    });

    it(`Returns field errors when campsite name is more than 50 characters`, async () => {
      const testUser = getValidUser();
      const createdUser = await new UserModel(testUser).save();
      const newCampsite = getValidCampsite();
      newCampsite['name'] = 'a'.repeat(51);
      const res = await useRequest({
        source: CREATE_CAMPSITE_MUTATION,
        variableValues: {
          input: {
            ...newCampsite,
          },
        },
        userId: createdUser.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        createCampsite: {
          campsite: null,
          errors: [
            {
              field: 'name',
              message: 'Campsite name cannot be more than 50 characters',
            },
          ],
        },
      });
    });

    it(`Returns field errors when campsite name is blank`, async () => {
      const testUser = getValidUser();
      const createdUser = await new UserModel(testUser).save();
      const newCampsite = getValidCampsite();
      newCampsite['name'] = '';
      const res = await useRequest({
        source: CREATE_CAMPSITE_MUTATION,
        variableValues: {
          input: {
            ...newCampsite,
          },
        },
        userId: createdUser.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        createCampsite: {
          campsite: null,
          errors: [
            {
              field: 'name',
              message: 'Campsite name cannot be less than 3 characters',
            },
            {
              field: 'name',
              message: 'You must provide a campsite name',
            },
          ],
        },
      });
    });

    it(`Returns field errors when campsite starting date is before today`, async () => {
      const testUser = getValidUser();
      const createdUser = await new UserModel(testUser).save();
      const newCampsite = getValidCampsite();
      newCampsite['startingDate'] = new Date('01/01/1950');
      const res = await useRequest({
        source: CREATE_CAMPSITE_MUTATION,
        variableValues: {
          input: {
            ...newCampsite,
          },
        },
        userId: createdUser.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        createCampsite: {
          campsite: null,
          errors: [
            {
              field: 'startingDate',
              message: 'Starting date must be in the future',
            },
          ],
        },
      });
    });

    it(`Returns field errors when campsite starting date is before today`, async () => {
      const testUser = getValidUser();
      const createdUser = await new UserModel(testUser).save();
      const newCampsite = getValidCampsite();
      newCampsite['startingDate'] = new Date('01/01/1950');
      const res = await useRequest({
        source: CREATE_CAMPSITE_MUTATION,
        variableValues: {
          input: {
            ...newCampsite,
          },
        },
        userId: createdUser.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        createCampsite: {
          campsite: null,
          errors: [
            {
              field: 'startingDate',
              message: 'Starting date must be in the future',
            },
          ],
        },
      });
    });

    it(`Returns field errors when campsite ending date is before today`, async () => {
      const testUser = getValidUser();
      const createdUser = await new UserModel(testUser).save();
      const newCampsite = getValidCampsite();
      newCampsite['endingDate'] = new Date('01/01/1950');
      const res = await useRequest({
        source: CREATE_CAMPSITE_MUTATION,
        variableValues: {
          input: {
            ...newCampsite,
          },
        },
        userId: createdUser.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject({
        createCampsite: {
          campsite: null,
          errors: [
            {
              field: 'endingDate',
              message: 'Ending date must be in the future',
            },
          ],
        },
      });
    });
  });

  describe('Query -> allCampsites', () => {
    it(`Returns a list of all campsites you own or are a member of`, async () => {
      const testCampsites = getAllValidCampsites();
      const testUsers = getAllValidUsers();
      const firstUser = await new UserModel(testUsers[0]).save();
      const secondUser = await new UserModel(testUsers[1]).save();

      // First user is owner of this campsite
      const userSite = await createCampsite(
        { input: { ...testCampsites[0] } },
        firstUser.id,
      );

      const memberSite = await createCampsite(
        { input: { ...testCampsites[1] } },
        secondUser.id,
      );

      // First user will not be a member of this campsite
      await createCampsite({ input: { ...testCampsites[2] } }, secondUser.id);

      // Make first user a member of this campsite
      // @ts-expect-error
      memberSite.campers.push({ id: firstUser.id });
      firstUser.memberCampsites.push(memberSite.id);
      await memberSite.save();
      await firstUser.save();

      const res = await useRequest({
        source: ALL_CAMPSITES_QUERY,
        userId: firstUser.id,
      });

      // Now we should expect 2 of the 3 campsites
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.allCampsites.length).toBe(2);
      expect(res.data?.allCampsites).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: userSite.id,
            name: userSite.name,
            startingDate: userSite.startingDate,
            endingDate: userSite.endingDate,
          }),
          expect.objectContaining({
            id: memberSite.id,
            name: memberSite.name,
            startingDate: memberSite.startingDate,
            endingDate: memberSite.endingDate,
          }),
        ]),
      );
    });
  });

  describe(`Query -> myCampsites`, () => {
    it(`Returns a list of only campsites you own`, async () => {
      const testCampsites = getAllValidCampsites();
      const testUsers = getAllValidUsers();
      const firstUser = await new UserModel(testUsers[0]).save();
      const secondUser = await new UserModel(testUsers[1]).save();

      // First user is owner of this campsite
      const userSite = await createCampsite(
        { input: { ...testCampsites[0] } },
        firstUser.id,
      );

      const memberSite = await createCampsite(
        { input: { ...testCampsites[1] } },
        secondUser.id,
      );

      // Make first user a member of this campsite
      // @ts-expect-error
      memberSite.campers.push({ id: firstUser.id });
      firstUser.memberCampsites.push(memberSite.id);
      await memberSite.save();
      await firstUser.save();

      const res = await useRequest({
        source: MY_CAMPSITES_QUERY,
        userId: firstUser.id,
      });

      // Now we should expect 1 of the 2 campsites
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.myCampsites.length).toBe(1);
      expect(res.data?.myCampsites).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: userSite.id,
            name: userSite.name,
            startingDate: userSite.startingDate,
            endingDate: userSite.endingDate,
          }),
        ]),
      );
    });
  });

  describe(`Query -> getCampsite`, () => {
    it(`Returns a specific campsite by id`, async () => {
      const testCampsites = getAllValidCampsites();
      const testUser = await new UserModel(getValidUser()).save();

      // First user is owner of this campsite
      const campsiteToGet = await createCampsite(
        { input: { ...testCampsites[0] } },
        testUser.id,
      );

      await createCampsite({ input: { ...testCampsites[1] } }, testUser.id);
      await createCampsite({ input: { ...testCampsites[2] } }, testUser.id);

      const res = await useRequest({
        source: GET_CAMPSITE_QUERY,
        variableValues: {
          campsiteId: campsiteToGet.id,
        },
        userId: testUser.id,
        csid: campsiteToGet.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.getCampsite).toMatchObject({
        id: campsiteToGet.id,
        name: campsiteToGet.name,
        startingDate: campsiteToGet.startingDate,
        endingDate: campsiteToGet.endingDate,
      });
    });

    it(`Throws an error when unauthorized access`, async () => {
      const testUser = await new UserModel(getValidUser()).save();
      const mockCampsiteId = mongoose.Types.ObjectId();
      const res = await useRequest({
        source: GET_CAMPSITE_QUERY,
        variableValues: {
          campsiteId: mockCampsiteId,
        },
        userId: testUser.id,
        csid: mockCampsiteId,
      });

      expect(res).toBeDefined();
      expect(res.errors).toBeDefined();
      expect.arrayContaining(
        expect.objectContaining({
          message: 'unauthorized access, must be a member of this camp',
        }),
      );
    });
  });
});
