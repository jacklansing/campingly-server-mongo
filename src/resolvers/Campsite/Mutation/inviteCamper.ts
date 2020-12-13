import {
  InviteStatus,
  MutationInviteCamperArgs,
} from '../../../resolvers/types/campsite.types';
import { MyContext } from '../../../types';
import UserModel from '../../../models/user';
import CampsiteModel from '../../../models/campsite';
import { ApolloError } from 'apollo-server-express';
import { v4 } from 'uuid';
import sendInviteCamperEmail from '../../../utils/emails/sendInviteCamperEmail';

export const inviteCamper = async (
  _: undefined,
  { input: { userEmail, role } }: MutationInviteCamperArgs,
  { req, res, redis }: MyContext,
): Promise<any> => {
  const campsiteId = req.headers.csid;

  const campsite = await CampsiteModel.findById(campsiteId);

  if (!campsite) throw new ApolloError('Could not find related campsite');

  // See if they are an existing user
  const userExists = await UserModel.findOne({ email: userEmail });

  // Create token
  const token = v4();
  // Set token with related campsite id
  redis.set(token, campsiteId as string, 'ex', 1000 * 60 * 60 * 24 * 30);

  // If they are, send them an email invite to join the campsite (use token?)
  if (userExists) {
    // Send them an invite to the specific campsite
    sendInviteCamperEmail(userEmail, `token=${token}&existing=1`, true);
  } else {
    // Send them an invite to join campingly and join them to campsite upon success.
    // If they signup due to this invite, we should update the campsite invites below with their userID.
    sendInviteCamperEmail(userEmail, `token=${token}&existing=0`, false);
  }

  campsite.invites.push({
    userId: userExists?.id ?? null,
    token,
    role,
    status: InviteStatus.PENDING,
  });

  await campsite.save();

  return { campsite, errors: null };
};
