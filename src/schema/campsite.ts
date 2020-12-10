import { gql } from 'apollo-server-express';

export const typeDefs = gql`
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

  type CampsiteResponse {
    campsite: Campsite
    errors: [FieldError]
  }

  extend type Query {
    getCampsite(campsiteId: String!): Campsite
    allCampsites: [Campsite]!
    myCampsites: [Campsite]!
  }

  extend type Mutation {
    createCampsite(input: CreateCampsiteInput!): CampsiteResponse
    createGearCategory(input: CreateGearCategoryInput!): CampsiteResponse
    addGear(input: AddGearInput!): CampsiteResponse
    deleteGear(input: DeleteGearInput!): CampsiteResponse
    volunteerGear(input: VolunteerGearInput!): CampsiteResponse
    undoVolunteerGear(input: UndoVolunteerGearInput!): CampsiteResponse
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
