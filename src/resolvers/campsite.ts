import { ApolloError } from 'apollo-server-express';
import { GearCategory } from '../entities/GearCategory';
import { Camper } from '../entities/Camper';
// import { Campsite } from '../models/Campsite';
import User from '../models/user';
import { isAuth } from '../middleware/isAuth';
import { MyContext } from '../types';
import { FieldError } from './user';
import { isMember } from '../middleware/isMember';
import { useValidationSchema } from '../utils/validators/useValidationSchema';
import { NewCampsiteSchema } from '../utils/validators/CampsiteSchema';
import { MutationRegisterArgs } from 'src/generated/graphql';

// @ObjectType()
// export class CampsiteResponse {
//   @Field(() => Campsite, { nullable: true })
//   campsite?: Campsite;

//   @Field(() => [FieldError], { nullable: true })
//   errors?: FieldError[];
// }

// @InputType()
// export class CampsiteInput {
//   @Field()
//   name: String;

//   @Field()
//   startingDate: Date;

//   @Field()
//   endingDate: Date;
// }

// @Resolver(Campsite)
// export class CampsiteResolver {
// UserLoader should no longer be required. Leaving in case we use it.
// @FieldResolver(() => User)
// counselor(@Root() campsite: Campsite, @Ctx() { userLoader }: MyContext) {
//   return userLoader.load(campsite.manager.id);
// }

// @FieldResolver(() => Camper)
// campers(@Root() campsite: Campsite) {
//   return Camper.find({ where: { campsiteId: campsite.id } });
// }

// @FieldResolver(() => GearCategory)
// gearCategories(@Root() campsite: Campsite) {
//   return GearCategory.find({ where: { campsiteId: campsite.id } });
// }

//   @Mutation(() => CampsiteResponse)
//   @UseMiddleware(isAuth)
//   async createCampsite(
//     @Arg('input') input: CampsiteInput,
//     @Ctx() { req, em }: MyContext,
//   ): Promise<CampsiteResponse> {
//     const alreadyUsed = await em.findOne(Campsite, {
//       name: input.name as string,
//       manager: { id: req.session.userId },
//     });

//     if (alreadyUsed) {
//       return {
//         errors: [
//           {
//             field: 'name',
//             message: 'You already have a campsite with this name',
//           },
//         ],
//       };
//     }

//     const { errors } = await useValidationSchema(input, NewCampsiteSchema);
//     if (errors) return { errors };

//     const manager = await em.findOne(User, { id: req.session.userId });
//     if (!manager) {
//       throw new ApolloError('Error retrieving current user info');
//     }

//     const campsite = em.create(Campsite, {
//       name: input.name,
//       startingDate: input.startingDate,
//       endingDate: input.endingDate,
//       manager: {
//         id: manager.id,
//         username: manager.username,
//       },
//     });

//     try {
//       await em.persistAndFlush(campsite);
//     } catch (e) {
//       console.error('Error inserting new campsite');
//     }

//     if (!campsite.id) {
//       throw new ApolloError('There was an error saving the new campsite');
//     }

//     return { campsite };
//   }

//   @Query(() => [Campsite])
//   @UseMiddleware(isAuth)
//   async allCampsites(@Ctx() { req, em }: MyContext) {
//     const userId = req.session.userId;
//     const allCampsites = await em.find(Campsite, {
//       $or: [
//         {
//           manager: { id: userId },
//         },
//         {
//           counselors: { id: userId },
//         },
//         {
//           campers: { id: userId },
//         },
//       ],
//     });

//     return allCampsites;
//   }

//   @Query(() => [Campsite])
//   @UseMiddleware(isAuth)
//   async myCampsites(@Ctx() { req, em }: MyContext) {
//     const userId = req.session.userId;
//     return em.find(Campsite, {
//       manager: {
//         id: userId,
//       },
//     });
//   }

//   @Query(() => Campsite)
//   @UseMiddleware(isAuth, isMember)
//   async getCampsite(
//     @Ctx() { em }: MyContext,
//     @Arg('campsiteId', () => Int) campsiteId: string,
//   ) {
//     const campsite = await em.findOne(Campsite, { id: campsiteId });

//     if (!campsite) {
//       throw new ApolloError('Campsite not found.');
//     }

//     return campsite;
//   }
// }
