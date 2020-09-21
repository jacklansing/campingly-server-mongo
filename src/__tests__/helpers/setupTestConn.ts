import 'dotenv-safe/config';
import { createTestConnection } from './createTestConnection';

createTestConnection(true).then(() => process.exit());
