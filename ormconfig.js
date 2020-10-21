require('dotenv-safe').config();
const path = require('path');
const entities = require('./dist/utils/entities');

module.exports = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  logging: true,
  synchronize: false,
  entities: entities.default,
  migrations: [path.join(__dirname, './dist/migrations/*')],
  cache: true,
};
