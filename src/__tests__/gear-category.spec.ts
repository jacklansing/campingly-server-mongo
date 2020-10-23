import { Connection, getConnection, createConnection } from 'typeorm';
import entities from '../utils/entities';
import {
  getAllValidGearCategories,
  getValidCampsite,
  getValidGearCategory,
  getValidUser,
} from './helpers/mocks';
import { createCampsite, createUser } from './helpers/testHelpers';
import { useRequest } from './helpers/useRequest';

export const CREATE_GEAR_CATEGORY_MUTATION = `
  mutation CreateGearCategory($campsiteId: Int!, $category: String!) {
    createGearCategory(campsiteId: $campsiteId, category: $category) {
      gearCategory {
        id
        category
        campsiteId
      }
      errors {
        field
        message
      }
    }
  }
`;

const GET_CATEGORIES_QUERY = `
query GetCategories($campsiteId: Int!){
  getCategories(campsiteId: $campsiteId) {
    gearCategories {
      id
      category
    }
    errors {
      message
    }
  }
}
`;

describe('Gear Category Resolver', () => {
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

  describe(`Mutation -> Create Gear Category`, () => {
    it(`Successfully creates a new category when campsite and category name are valid`, async () => {
      const testCategory = getValidGearCategory();
      const testUser = await createUser(getValidUser());
      const testCampsite = await createCampsite(
        getValidCampsite(),
        testUser.id,
      );

      const res = await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          category: testCategory,
          campsiteId: testCampsite.id,
        },
        csid: testCampsite.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.createGearCategory).toEqual({
        gearCategory: expect.objectContaining({
          category: testCategory,
          campsiteId: testCampsite.id,
        }),
        errors: null,
      });
    });

    it(`Returns field errors when category name is less than 3 characters`, async () => {
      const testUser = await createUser(getValidUser());
      const testCampsite = await createCampsite(
        getValidCampsite(),
        testUser.id,
      );

      const res = await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          category: 'hi',
          campsiteId: testCampsite.id,
        },
        csid: testCampsite.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.createGearCategory).toEqual({
        gearCategory: null,
        errors: [
          {
            field: 'category',
            message: 'Category name cannot be less than 3 characters',
          },
        ],
      });
    });

    it(`Returns field errors when category name more than 30 characters`, async () => {
      const testUser = await createUser(getValidUser());
      const testCampsite = await createCampsite(
        getValidCampsite(),
        testUser.id,
      );

      const res = await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          category: 'hi'.repeat(16),
          campsiteId: testCampsite.id,
        },
        csid: testCampsite.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.createGearCategory).toEqual({
        gearCategory: null,
        errors: [
          {
            field: 'category',
            message: 'Category name cannot be more than 30 characters',
          },
        ],
      });
    });

    it(`Returns field errors when category name is empty`, async () => {
      const testUser = await createUser(getValidUser());
      const testCampsite = await createCampsite(
        getValidCampsite(),
        testUser.id,
      );

      const res = await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          category: '',
          campsiteId: testCampsite.id,
        },
        csid: testCampsite.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.createGearCategory).toEqual({
        gearCategory: null,
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
      const testUser = await createUser(getValidUser());
      const testCampsite = await createCampsite(
        getValidCampsite(),
        testUser.id,
      );

      await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          category: testCategory,
          campsiteId: testCampsite.id,
        },
        csid: testCampsite.id,
      });

      const res = await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          category: testCategory,
          campsiteId: testCampsite.id,
        },
        csid: testCampsite.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.createGearCategory).toEqual({
        gearCategory: null,
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
      const testUser = await createUser(getValidUser());
      const testCampsite = await createCampsite(
        getValidCampsite(),
        testUser.id,
      );

      const res = await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          category: testCategory,
          campsiteId: 999999,
        },
        csid: testCampsite.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeNull();
      expect(res.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: 'Invalid Campsite' }),
        ]),
      );
    });
  });

  describe(`Query -> Get Campsite Gear Categories`, () => {
    it(`Returns all of the gear categories for a campsite`, async () => {
      const testCategories = getAllValidGearCategories();
      const testUser = await createUser(getValidUser());
      const testCampsite = await createCampsite(
        getValidCampsite(),
        testUser.id,
      );

      await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          category: testCategories[0],
          campsiteId: testCampsite.id,
        },
        csid: testCampsite.id,
      });

      await useRequest({
        source: CREATE_GEAR_CATEGORY_MUTATION,
        userId: testUser.id,
        variableValues: {
          category: testCategories[1],
          campsiteId: testCampsite.id,
        },
        csid: testCampsite.id,
      });

      const res = await useRequest({
        source: GET_CATEGORIES_QUERY,
        userId: testUser.id,
        variableValues: {
          campsiteId: testCampsite.id,
        },
        csid: testCampsite.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.getCategories.gearCategories.length).toBe(2);
      expect(res.data?.getCategories.gearCategories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ category: testCategories[0] }),
          expect.objectContaining({ category: testCategories[1] }),
        ]),
      );
    });
    it(`Returns error when no categories exist for the campsite`, async () => {
      const testUser = await createUser(getValidUser());
      const testCampsite = await createCampsite(
        getValidCampsite(),
        testUser.id,
      );

      const res = await useRequest({
        source: GET_CATEGORIES_QUERY,
        userId: testUser.id,
        variableValues: {
          campsiteId: testCampsite.id,
        },
        csid: testCampsite.id,
      });

      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data?.getCategories).toMatchObject({
        gearCategories: null,
        errors: [
          {
            message: 'No categories exist for this campsite.',
          },
        ],
      });
    });
  });
});
