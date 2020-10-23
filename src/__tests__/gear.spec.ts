import { Connection, createConnection, getConnection } from 'typeorm';
import entities from '../utils/entities';
import {
  getValidCampsite,
  getValidGear,
  getValidGearCategory,
  getValidUser,
} from './helpers/mocks';
import {
  createCampsite,
  createGearCategory,
  createUser,
} from './helpers/testHelpers';
import { useRequest } from './helpers/useRequest';

const ADD_GEAR_MUTATION = `
    mutation AddGear($input: GearInput!) {
        addGear(input: $input) {
        gear {
            id
            name
            quantity
        }
        errors {
            field
            message
        }
        }
    }
`;

describe('User Resolver', () => {
  let conn: Connection;
  beforeAll(async () => {
    conn = await createConnection({
      type: 'postgres',
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: `campingly_test_${process.env.JEST_WORKER_ID}`,
      logging: false,
      entities,
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

  describe('Mutation -> Add Gear', () => {
    it(`Successfully adds gear given valid campsite, category, and gear details`, async () => {
      const testUser = await createUser(getValidUser());
      const testCampsite = await createCampsite(
        getValidCampsite(),
        testUser.id,
      );
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
            gearCategoryId: testGearCategory.id,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.addGear).toEqual({
        gear: expect.objectContaining(testGear),
        errors: null,
      });
    });

    it(`Returns a field error when gear name is less than 3 characters`, async () => {
      const testUser = await createUser(getValidUser());
      const testCampsite = await createCampsite(
        getValidCampsite(),
        testUser.id,
      );
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
            gearCategoryId: testGearCategory.id,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.addGear).toEqual({
        gear: null,
        errors: [
          {
            field: 'name',
            message: 'Gear name cannot be less than 3 characters',
          },
        ],
      });
    });

    it(`Returns a field error when gear name is more than 30 characters`, async () => {
      const testUser = await createUser(getValidUser());
      const testCampsite = await createCampsite(
        getValidCampsite(),
        testUser.id,
      );
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
            gearCategoryId: testGearCategory.id,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.addGear).toEqual({
        gear: null,
        errors: [
          {
            field: 'name',
            message: 'Gear name cannot be more than 30 characters',
          },
        ],
      });
    });

    it(`Returns field errors when gear name is empty`, async () => {
      const testUser = await createUser(getValidUser());
      const testCampsite = await createCampsite(
        getValidCampsite(),
        testUser.id,
      );
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
            gearCategoryId: testGearCategory.id,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.addGear).toEqual({
        gear: null,
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
      const testUser = await createUser(getValidUser());
      const testCampsite = await createCampsite(
        getValidCampsite(),
        testUser.id,
      );
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
            gearCategoryId: testGearCategory.id,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.addGear).toEqual({
        gear: null,
        errors: [
          {
            field: 'quantity',
            message: 'Quantity cannot be less than 1',
          },
        ],
      });
    });

    it(`Returns a field error when gear quantity is more than 99`, async () => {
      const testUser = await createUser(getValidUser());
      const testCampsite = await createCampsite(
        getValidCampsite(),
        testUser.id,
      );
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
            gearCategoryId: testGearCategory.id,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.addGear).toEqual({
        gear: null,
        errors: [
          {
            field: 'quantity',
            message: 'Quantity cannot be more than 99',
          },
        ],
      });
    });

    it(`Returns error when given invalid gear category ID`, async () => {
      const testUser = await createUser(getValidUser());
      const testCampsite = await createCampsite(
        getValidCampsite(),
        testUser.id,
      );

      const testGear = getValidGear();
      const res = await useRequest({
        source: ADD_GEAR_MUTATION,
        userId: testUser.id,
        csid: testCampsite.id,
        variableValues: {
          input: {
            ...testGear,
            gearCategoryId: 9999,
          },
        },
      });

      expect(res).toBeDefined();
      expect(res.data).toBeNull();
      expect(res.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: 'Category does not exist' }),
        ]),
      );
    });
  });
});
