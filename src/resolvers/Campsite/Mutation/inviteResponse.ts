import { MyContext } from '../../../types';
import CampsiteModel from '../../../models/campsite';
import UserModel from '../../../models/user';
import { ApolloError } from 'apollo-server-express';
import {
  CampsiteResponse,
  InviteStatus,
  MutationInviteResponseArgs,
} from '../../../resolvers/types/campsite.types';
import { CampsiteRole } from '../../../resolvers/types/shared.types';

export const inviteResponse = async (
  _: undefined,
  { input: { status, token } }: MutationInviteResponseArgs,
  { req, res, redis }: MyContext,
): Promise<CampsiteResponse> => {
  const userId = req.session.userId;
  const campsiteId = await redis.get(token);

  if (!campsiteId) {
    return {
      errors: [
        {
          field: 'token',
          message: 'Invite token invalid or expired',
        },
      ],
    };
  }

  const campsite = await CampsiteModel.findById(campsiteId);
  const user = await UserModel.findById(userId);

  if (!campsite) throw new ApolloError('Could not find related campsite');
  if (!user) throw new ApolloError('Error retreiving user info');

  const originalInvite = campsite.invites.find(
    (invite) => invite.token === token,
  );

  if (!originalInvite) throw new ApolloError('Could not find related invite');

  originalInvite.status = status;

  if (originalInvite.userId === null) {
    originalInvite.userId = userId;
  }

  // Put into appropriate group if the invite is accepted.
  if ((status = InviteStatus.ACCEPTED)) {
    if (originalInvite.role === CampsiteRole.COUNSELOR) {
      campsite.counselors.push(userId);
    }

    if (originalInvite.role === CampsiteRole.CAMPER) {
      campsite.campers.push(userId);
    }

    // Add this campsite reference to the user's list of campsites
    user.memberCampsites.push(campsite._id);
    await user.save();
  }

  // Save changes to campsite and delete token from redis.
  await campsite.save();
  redis.del(token);

  return { campsite, errors: null };
};
