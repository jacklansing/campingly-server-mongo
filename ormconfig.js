require('dotenv-safe').config();
const path = require('path');
const { User } = require('./dist/entities/User');

module.exports = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  logging: true,
  synchronize: false,
  entities: [User],
  migrations: [path.join(__dirname, './dist/migrations/*')],
};
