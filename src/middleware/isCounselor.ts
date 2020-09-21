import { MiddlewareFn } from 'type-graphql';
import { MyContext } from 'src/types';
import { AuthenticationError } from 'apollo-server-express';
import { Campsite } from '../entities/Campsite';
import { Camper } from '../entities/Camper';

export const isCounselor: MiddlewareFn<MyContext> = async (
  { context },
  next,
) => {
  const campsiteId = context.req.body.variables.campsiteId;
  const userId = context.req.session.userId;

  const isOwner = await Campsite.findOne({
    where: { id: campsiteId, counselorId: userId },
  });

  if (isOwner) return next();

  const isCounselor = Camper.findOne({
    where: { campsiteId, userId },
  });

  if (isCounselor) return next();

  throw new AuthenticationError('unauthorized access, must be camp counselor');
};
