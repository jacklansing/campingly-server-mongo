import { CampsiteResolver } from '../resolvers/campsite';
import { buildSchema } from 'type-graphql';
import { UserResolver } from '../resolvers/user';
import { GearCategoryResolver } from '../resolvers/gear-category';
import { GearResolver } from '../resolvers/gear';
import { GearVolunteerResolver } from '../resolvers/gear-volunteer';

export const createSchema = () =>
  buildSchema({
    resolvers: [
      UserResolver,
      CampsiteResolver,
      GearCategoryResolver,
      GearResolver,
      GearVolunteerResolver,
    ],
    validate: false,
  });
