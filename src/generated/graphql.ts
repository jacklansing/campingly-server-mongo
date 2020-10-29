export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};









export type User = {
  __typename?: 'User';
  id?: Maybe<Scalars['String']>;
  username: Scalars['String'];
  displayName: Scalars['String'];
  email: Scalars['String'];
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
  campsites: Array<Maybe<Campsite>>;
};

export type Campsite = {
  __typename?: 'Campsite';
  id?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  startingDate: Scalars['String'];
  endingDate: Scalars['String'];
  manager: User;
  counselors: Array<Maybe<User>>;
  campers: Array<Maybe<User>>;
  gearCategories?: Maybe<Array<Maybe<GearCategory>>>;
};

export type GearCategory = {
  __typename?: 'GearCategory';
  category: Scalars['String'];
  gear?: Maybe<Array<Maybe<Gear>>>;
};

export type Gear = {
  __typename?: 'Gear';
  name: Scalars['String'];
  quantity: Scalars['Int'];
  volunteers: Array<Maybe<GearVolunteer>>;
};

export type GearVolunteer = {
  __typename?: 'GearVolunteer';
  userId: User;
  volunteerAmount: Scalars['Int'];
};

export type ErrorMessage = {
  __typename?: 'ErrorMessage';
  message: Scalars['String'];
};

export type FieldErrors = {
  __typename?: 'FieldErrors';
  field: Scalars['String'];
  message: Scalars['String'];
};

export type UserResponse = {
  __typename?: 'UserResponse';
  user?: Maybe<User>;
  errors?: Maybe<Array<Maybe<FieldErrors>>>;
};

export type LogoutResponse = {
  __typename?: 'LogoutResponse';
  success: Scalars['Boolean'];
  errors?: Maybe<Array<Maybe<ErrorMessage>>>;
};

export type Query = {
  __typename?: 'Query';
  me?: Maybe<User>;
  getCampsite?: Maybe<Campsite>;
};


export type QueryGetCampsiteArgs = {
  campsiteId: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  register?: Maybe<UserResponse>;
  login?: Maybe<UserResponse>;
  logout?: Maybe<LogoutResponse>;
  forgotPassword?: Maybe<Scalars['Boolean']>;
  resetPassword?: Maybe<UserResponse>;
};


export type MutationRegisterArgs = {
  input: RegistrationInput;
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationForgotPasswordArgs = {
  email: Scalars['String'];
};


export type MutationResetPasswordArgs = {
  input: ResetPasswordInput;
};

export type RegistrationInput = {
  username: Scalars['String'];
  email: Scalars['String'];
  displayName?: Maybe<Scalars['String']>;
  password: Scalars['String'];
};

export type LoginInput = {
  usernameOrEmail: Scalars['String'];
  password: Scalars['String'];
};

export type ResetPasswordInput = {
  token: Scalars['String'];
  newPassword: Scalars['String'];
};

export type AdditionalEntityFields = {
  path?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
};

import { ObjectID } from 'mongodb';
export type UserDbObject = {
  _id?: Maybe<ObjectID>,
  username: string,
  displayName: string,
  email: string,
  createdAt: string,
  updatedAt: string,
  campsites: Array<Maybe<CampsiteDbObject['_id']>>,
};

export type CampsiteDbObject = {
  _id?: Maybe<ObjectID>,
  name: string,
  startingDate: string,
  endingDate: string,
  manager: UserDbObject['_id'],
  counselors: Array<Maybe<UserDbObject['_id']>>,
  campers: Array<Maybe<UserDbObject['_id']>>,
  gearCategories?: Maybe<Array<Maybe<GearCategoryDbObject>>>,
};

export type GearCategoryDbObject = {
  category: string,
  gear?: Maybe<Array<Maybe<GearDbObject>>>,
};

export type GearDbObject = {
  name: string,
  quantity: number,
  volunteers: Array<Maybe<GearVolunteerDbObject>>,
};

export type GearVolunteerDbObject = {
  userId: UserDbObject['_id'],
  volunteerAmount: number,
};
