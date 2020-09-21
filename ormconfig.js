require('dotenv-safe').config();
const path = require('path');
const { User } = require('./dist/entities/User');
const { Camper } = require('./dist/entities/Camper');
const { Campsite } = require('./dist/entities/Campsite');
const { Gear } = require('./dist/entities/Gear');
const { GearCategory } = require('./dist/entities/GearCategory');
const { GearVolunteer } = require('./dist/entities/GearVolunteer');

module.exports = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  logging: true,
  synchronize: false,
  entities: [User, Camper, Campsite, Gear, GearCategory, GearVolunteer],
  migrations: [path.join(__dirname, './dist/migrations/*')],
  cache: true,
};
