import { createConnection } from 'typeorm';
import entities from '../../utils/entities';

export default async () => {
  const connection = await createConnection();

  const databaseName = `campingly_test_template`;
  const workers = parseInt(process.env.JEST_WORKERS || '1');

  await connection.query(`DROP DATABASE IF EXISTS ${databaseName}`);
  await connection.query(`CREATE DATABASE ${databaseName}`);

  const templateDBConnection = await createConnection({
    name: 'templateConnection',
    type: 'postgres',
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: 'campingly_test_template',
    entities,
    synchronize: true,
  });

  await templateDBConnection.runMigrations();
  await templateDBConnection.close();

  for (let i = 1; i <= workers; i++) {
    const workerDatabaseName = `campingly_test_${i}`;

    await connection.query(`DROP DATABASE IF EXISTS ${workerDatabaseName};`);
    await connection.query(
      `CREATE DATABASE ${workerDatabaseName} TEMPLATE ${databaseName};`,
    );
  }

  await connection.close();
};
