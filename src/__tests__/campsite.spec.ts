import { User } from '../entities/User';
import { Connection, createConnection, getConnection } from 'typeorm';
import { getValidCampsite, getValidUser } from './helpers/mocks';
import { useRequest } from './helpers/useRequest';
import entities from '../utils/entities';
import { Campsite } from '../entities/Campsite';

const CREATE_CAMPSITE_MUTATION = `
mutation CreateCampsite($input: CampsiteInput!) {
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

describe('Campsite Resolver', () => {
  let conn: Connection;
  beforeAll(async () => {
    conn = await createConnection({
      type: 'postgres',
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: `campingly_test_${process.env.JEST_WORKER_ID}`,
      entities,
      logging: false,
    });
  });

  beforeEach(async () => {
    const queryRunner = getConnection().createQueryRunner();

    await queryRunner.query(`
          DO
          $func$
          BEGIN
            EXECUTE (
              SELECT 'TRUNCATE TABLE ' || string_agg(oid::regclass::text, ', ') || ' CASCADE'
                FROM pg_class
                WHERE relkind = 'r'
                AND relnamespace = 'public'::regnamespace
            );
          END
          $func$;
        `);
    await queryRunner.release();
  });

  afterAll(async () => {
    await conn.close();
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
      expect(res.data).toBeNull();
      expect(res.errors).toBeDefined();
      const error = res.errors![0];
      expect(error.message).toBe('must authenticate');
    });

    it(`Successfully creates campsite when logged in and valid campsite`, async () => {
      const testUser = getValidUser();
      await User.insert(testUser);
      const createdUser = await User.findOneOrFail({
        where: { username: testUser.username },
      });
      const newCampsite = getValidCampsite();
      const res = await useRequest({
        source: CREATE_CAMPSITE_MUTATION,
        variableValues: {
          input: {
            ...newCampsite,
          },
        },
        userId: createdUser.id,
      });
      const createdCampsite = await Campsite.findOneOrFail({
        where: {
          counselorId: createdUser.id,
          name: newCampsite.name,
        },
      });
      expect(res).toBeDefined();
      expect(res.data?.createCampsite.campsite).toMatchObject({
        id: createdCampsite.id,
        ...newCampsite,
      });
    });

    it(`Returns field error when user already has campsite using same name`, async () => {
      const testUser = getValidUser();
      await User.insert(testUser);
      const createdUser = await User.findOneOrFail({
        where: { username: testUser.username },
      });
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
      await User.insert(testUser);
      const createdUser = await User.findOneOrFail({
        where: { username: testUser.username },
      });
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
      await User.insert(testUser);
      const createdUser = await User.findOneOrFail({
        where: { username: testUser.username },
      });
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
      await User.insert(testUser);
      const createdUser = await User.findOneOrFail({
        where: { username: testUser.username },
      });
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
      await User.insert(testUser);
      const createdUser = await User.findOneOrFail({
        where: { username: testUser.username },
      });
      const newCampsite = getValidCampsite();
      newCampsite['startingDate'] = new Date('01/01/1950').toISOString();
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
      await User.insert(testUser);
      const createdUser = await User.findOneOrFail({
        where: { username: testUser.username },
      });
      const newCampsite = getValidCampsite();
      newCampsite['startingDate'] = new Date('01/01/1950').toISOString();
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
      await User.insert(testUser);
      const createdUser = await User.findOneOrFail({
        where: { username: testUser.username },
      });
      const newCampsite = getValidCampsite();
      newCampsite['endingDate'] = new Date('01/01/1950').toISOString();
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
});
