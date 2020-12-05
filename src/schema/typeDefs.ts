import { gql } from 'apollo-server-express';

const typeDefs = gql`
  directive @objectAuth(requires: Role = LOGIN) on OBJECT
  directive @fieldAuth(requires: Role = LOGIN) on FIELD_DEFINITION

  enum Role {
    LOGIN
    USER
    COUNSELOR
    MANAGER
  }

  type User {
    id: ObjectID
    username: String!
    displayName: String
    email: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Campsite {
    id: ObjectID
    name: String!
    startingDate: DateTime!
    endingDate: DateTime!
    manager: User!
    counselors: [User]!
    campers: [User]!
    gearCategories: [GearCategory]
  }

  type GearCategory {
    id: ObjectID
    category: String!
    gear: [Gear]
  }

  type Gear {
    id: ObjectID
    name: String!
    quantity: Int!
    volunteers: [GearVolunteer]!
    userHasVolunteered: Boolean!
  }

  type GearVolunteer {
    userId: ObjectID!
    volunteerAmount: Int!
  }

  type ErrorMessage {
    message: String!
  }

  type FieldError {
    field: String!
    message: String!
  }

  type UserResponse {
    user: User
    errors: [FieldError]
  }

  type LogoutResponse {
    success: Boolean!
    errors: [ErrorMessage]
  }

  type CampsiteResponse {
    campsite: Campsite
    errors: [FieldError]
  }

  type Query {
    me: User
    getCampsite(campsiteId: String!): Campsite
    allCampsites: [Campsite]!
    myCampsites: [Campsite]!
  }

  type Mutation {
    register(input: RegistrationInput!): UserResponse
    login(input: LoginInput!): UserResponse
    logout: LogoutResponse
    forgotPassword(email: String!): Boolean
    resetPassword(input: ResetPasswordInput!): UserResponse
    createCampsite(input: CreateCampsiteInput!): CampsiteResponse
    createGearCategory(input: CreateGearCategoryInput!): CampsiteResponse
    addGear(input: AddGearInput!): CampsiteResponse
    deleteGear(input: DeleteGearInput!): CampsiteResponse
    volunteerGear(input: VolunteerGearInput!): CampsiteResponse
    undoVolunteerGear(input: UndoVolunteerGearInput!): CampsiteResponse
  }

  input RegistrationInput {
    username: String!
    email: String!
    displayName: String
    password: String!
  }

  input LoginInput {
    usernameOrEmail: String!
    password: String!
  }

  input ResetPasswordInput {
    token: String!
    newPassword: String!
  }

  input CreateCampsiteInput {
    name: String!
    startingDate: DateTime!
    endingDate: DateTime!
  }

  input CreateGearCategoryInput {
    category: String!
    campsiteId: ObjectID!
  }

  input AddGearInput {
    campsiteId: ObjectID!
    gearCategoryId: ObjectID!
    name: String!
    quantity: Int!
  }

  input DeleteGearInput {
    campsiteId: ObjectID!
    gearCategoryId: ObjectID!
    gearId: ObjectID!
  }

  input VolunteerGearInput {
    campsiteId: ObjectID!
    gearCategoryId: ObjectID!
    gearId: ObjectID!
    volunteerAmount: Int!
  }

  input UndoVolunteerGearInput {
    campsiteId: ObjectID!
    gearCategoryId: ObjectID!
    gearId: ObjectID!
  }
`;

export default typeDefs;
