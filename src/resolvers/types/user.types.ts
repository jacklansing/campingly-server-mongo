import Schema, { Document, Model } from 'mongoose';
import { ErrorMessage, FieldError } from './shared.types';

export interface IUser {
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  userCampsites: Schema.Types.ObjectId[];
  memberCampsites: Schema.Types.ObjectId[];
}

export interface IUserDocument extends IUser, Document {}
export interface IUserModel extends Model<IUserDocument> {}

export type MutationLoginArgs = {
  input: {
    usernameOrEmail: string;
    password: string;
  };
};

export type MutationRegisterArgs = {
  input: {
    username: string;
    displayName: string;
    email: string;
    password: string;
  };
};

export type MutationResetPasswordArgs = {
  input: {
    token: string;
    newPassword: string;
  };
};

export type UserResponse = {
  user?: IUser;
  errors?: FieldError[];
};

export type LogoutResponse = {
  success: boolean;
  errors?: ErrorMessage[];
};
