import { createConnection } from 'typeorm';
import { User } from '../../entities/User';

export const createTestConnection = async () => {
  return createConnection({
    type: 'postgres',
    url: process.env.TEST_DATABASE_URL,
    logging: false,
    synchronize: true,
    dropSchema: true,
    entities: [User],
  });
};
