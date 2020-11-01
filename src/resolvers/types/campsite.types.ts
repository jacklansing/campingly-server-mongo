import Schema, { Document, Model } from 'mongoose';
import { ErrorMessage, FieldError } from './shared.types';
import { IUser } from './user.types';

export interface ICampsite {
  name: string;
  startingDate: Date;
  endingDate: Date;
  manager: Schema.Types.ObjectId | IUser;
  counselors: Schema.Types.ObjectId[] | IUser[];
  campers: Schema.Types.ObjectId[] | IUser[];
  gearCategories: IGearCategory[];
}

export interface ICampsiteDocument extends ICampsite, Document {}
export interface ICampsiteModel extends Model<ICampsiteDocument> {}

export interface IGearCategory {
  category: string;
  gear: IGear[];
}

export interface IGear {
  name: string;
  quantity: number;
  volunteers: IGearVolunteer[];
}

export interface IGearVolunteer {
  userId: Schema.Types.ObjectId;
  volunteerAmount: number;
}

export type MutationCreateCampsiteArgs = {
  input: {
    name: string;
    startingDate: Date;
    endingDate: Date;
  };
};

export type MutationCreateGearCategoryArgs = {
  input: {
    category: string;
    campsiteId: Schema.Types.ObjectId;
  };
};

export type MutationAddGearArgs = {
  input: {
    campsiteId: Schema.Types.ObjectId;
    gearCategoryName: string;
    name: string;
    quantity: number;
  };
};

export type MutationDeleteGearArgs = {
  input: {
    campsiteId: Schema.Types.ObjectId;
    gearCategoryName: string;
    gearName: string;
  };
};

export type MutationVolunteerGearArgs = {
  input: {
    campsiteId: Schema.Types.ObjectId;
    gearCategoryName: string;
    gearName: string;
    volunteerAmount: number;
  };
};

export type MutationUndoVolunteerGearArgs = {
  input: {
    campsiteId: Schema.Types.ObjectId;
    gearCategoryName: string;
    gearName: string;
  };
};

export type CampsiteResponse = {
  campsite?: ICampsite;
  errors?: FieldError[];
};
