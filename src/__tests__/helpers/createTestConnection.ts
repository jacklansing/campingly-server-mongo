import { createConnection } from 'typeorm';
import { User } from '../../entities/User';
import { Campsite } from '../../entities/Campsite';
import { Camper } from '../../entities/Camper';
import { Gear } from '../../entities/Gear';
import { GearCategory } from '../../entities/GearCategory';
import { GearVolunteer } from '../../entities/GearVolunteer';

export const createTestConnection = (drop: boolean = false) => {
  return createConnection({
    type: 'postgres',
    url: process.env.TEST_DATABASE_URL,
    logging: false,
    synchronize: drop,
    dropSchema: drop,
    entities: [User, Campsite, Camper, Gear, GearCategory, GearVolunteer],
  });
};
