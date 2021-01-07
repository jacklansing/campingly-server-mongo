import Schema, { Document, Model } from 'mongoose';
import { CampsiteRole, FieldError } from './shared.types';
import { IUser } from './user.types';

export interface ICampsite {
  name: string;
  startingDate: Date;
  endingDate: Date;
  manager: Schema.Types.ObjectId | IUser;
  counselors: Schema.Types.ObjectId[] | IUser[];
  campers: Schema.Types.ObjectId[] | IUser[];
  gearCategories: IGearCategory[];
  invites: ICampsiteInvite[];
}

export interface ICampsiteDocument extends ICampsite, Document {}
export interface ICampsiteModel extends Model<ICampsiteDocument> {}

export interface IGearCategory {
  id?: Schema.Types.ObjectId;
  category: string;
  gear: IGear[];
}

export interface IGear {
  id?: Schema.Types.ObjectId;
  name: string;
  quantity: number;
  volunteers: IGearVolunteer[];
}

export interface IGearVolunteer {
  id?: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  volunteerAmount: number;
}

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export interface ICampsiteInvite {
  userId: Schema.Types.ObjectId;
  status: InviteStatus;
  role: CampsiteRole;
  token: string;
  email: string;
}

export type MutationInviteCamperArgs = {
  input: {
    userEmail: string;
    role: CampsiteRole;
  };
};

export type MutationInviteResponseArgs = {
  input: {
    status: InviteStatus;
    token: string;
  };
};

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
    gearCategoryId: Schema.Types.ObjectId;
    name: string;
    quantity: number;
  };
};

export type MutationDeleteGearArgs = {
  input: {
    campsiteId: Schema.Types.ObjectId;
    gearCategoryId: Schema.Types.ObjectId;
    gearId: Schema.Types.ObjectId;
  };
};

export type MutationVolunteerGearArgs = {
  input: {
    campsiteId: Schema.Types.ObjectId;
    gearCategoryId: Schema.Types.ObjectId;
    gearId: Schema.Types.ObjectId;
    volunteerAmount: number;
  };
};

export type MutationUndoVolunteerGearArgs = {
  input: {
    campsiteId: Schema.Types.ObjectId;
    gearCategoryId: Schema.Types.ObjectId;
    gearId: Schema.Types.ObjectId;
  };
};

export type CampsiteResponse = {
  campsite?: ICampsite;
  errors?: FieldError[];
};

export type CampsitePreview = {
  name: string;
  startingDate: Date;
  endingDate: Date;
  manager: IUser;
};
