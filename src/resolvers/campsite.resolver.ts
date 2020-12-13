import { MyContext } from '../types';
import { IGear } from './types/campsite.types';
import {
  allCampsites,
  myCampsites,
  getCampsite,
  campsitePreview,
} from './Campsite/Query';
import {
  createCampsite,
  createGearCategory,
  addGear,
  deleteGear,
  volunteerGear,
  undoVolunteerGear,
  inviteCamper,
  inviteResponse,
} from './Campsite/Mutation';
import { manager, campers, counselors } from './Campsite/Field';

export default {
  Query: {
    getCampsite,
    allCampsites,
    myCampsites,
    campsitePreview,
  },
  Mutation: {
    createCampsite,
    createGearCategory,
    addGear,
    deleteGear,
    volunteerGear,
    undoVolunteerGear,
    inviteCamper,
    inviteResponse,
  },
  Campsite: {
    manager,
    campers,
    counselors,
  },
  Gear: {
    userHasVolunteered: async (parent: IGear, _: any, { req }: MyContext) => {
      return !!parent.volunteers.find(
        (v) => v.userId.toString() === req.session.userId,
      );
    },
  },
};
