import { buildSchemaFromTypeDefinitions } from 'apollo-server-express';
import typeDefs from '../schema/typeDefs';

export const buildSchema = () => buildSchemaFromTypeDefinitions(typeDefs);
