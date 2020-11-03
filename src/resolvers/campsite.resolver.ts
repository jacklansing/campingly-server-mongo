import { MyContext } from '../types';
import { IGear } from './types/campsite.types';
import { allCampsites, myCampsites, getCampsite } from './Campsite/Query';
import {
  createCampsite,
  createGearCategory,
  addGear,
  deleteGear,
  volunteerGear,
  undoVolunteerGear,
} from './Campsite/Mutation';
import { manager } from './Campsite/Field';

export default {
  Query: {
    getCampsite,
    allCampsites,
    myCampsites,
  },
  Mutation: {
    createCampsite,
    createGearCategory,
    addGear,
    deleteGear,
    volunteerGear,
    undoVolunteerGear,
  },
  Campsite: {
    manager,
  },
  Gear: {
    userHasVolunteered: async (parent: IGear, _: any, { req }: MyContext) => {
      return !!parent.volunteers.find(
        (v) => v.userId.toString() === req.session.userId,
      );
    },
  },
};
