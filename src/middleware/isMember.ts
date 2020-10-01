import { MiddlewareFn } from 'type-graphql';
import { MyContext } from 'src/types';
import { AuthenticationError } from 'apollo-server-express';
import { Campsite } from '../entities/Campsite';
import { Camper } from '../entities/Camper';

export const isMember: MiddlewareFn<MyContext> = async ({ context }, next) => {
  const campsiteId = parseInt(context.req.headers.csid as string);
  const userId = context.req.session.userId;

  const isOwner = await Campsite.findOne({
    where: { id: campsiteId, counselorId: userId },
  });
  if (isOwner) return next();

  const isMember = await Camper.findOne({
    where: { campsiteId, userId },
  });

  if (isMember) return next();

  throw new AuthenticationError(
    'unauthorized access, must be a member of this camp',
  );
};
