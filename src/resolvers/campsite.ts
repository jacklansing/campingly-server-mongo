import { ApolloError } from 'apollo-server-express';
import { GearCategory } from '../entities/GearCategory';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { Camper } from '../entities/Camper';
import { Campsite } from '../entities/Campsite';
import { User } from '../entities/User';
import { isAuth } from '../middleware/isAuth';
import { MyContext } from '../types';
import { FieldError } from './user';
import { isMember } from '../middleware/isMember';
import { useValidationSchema } from '../utils/validators/useValidationSchema';
import { NewCampsiteSchema } from '../utils/validators/CampsiteSchema';

@ObjectType()
class CampsiteResponse {
  @Field(() => Campsite, { nullable: true })
  campsite?: Campsite;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@InputType()
class CampsiteInput {
  @Field()
  name: String;

  @Field()
  startingDate: Date;

  @Field()
  endingDate: Date;
}

@Resolver(Campsite)
export class CampsiteResolver {
  @FieldResolver(() => User)
  counselor(@Root() campsite: Campsite, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(campsite.counselorId);
  }

  @FieldResolver(() => Camper)
  campers(@Root() campsite: Campsite) {
    return Camper.find({ where: { campsiteId: campsite.id } });
  }

  @FieldResolver(() => GearCategory)
  gearCategories(@Root() campsite: Campsite) {
    return GearCategory.find({ where: { campsiteId: campsite.id } });
  }

  @Mutation(() => CampsiteResponse)
  @UseMiddleware(isAuth)
  async createCampsite(
    @Arg('input') input: CampsiteInput,
    @Ctx() { req }: MyContext,
  ): Promise<CampsiteResponse> {
    const alreadyUsed = await Campsite.findOne({
      where: { name: input.name, counselorId: req.session.userId },
    });

    if (alreadyUsed) {
      return {
        errors: [
          {
            field: 'name',
            message: 'You already have a campsite with this name',
          },
        ],
      };
    }

    const { errors } = await useValidationSchema(input, NewCampsiteSchema);
    if (errors) return { errors };

    const campsite = Campsite.create({
      name: input.name,
      startingDate: input.startingDate,
      endingDate: input.endingDate,
      counselorId: req.session.userId,
    } as Campsite);

    try {
      await campsite.save();
    } catch (e) {
      console.error('error inserting new campsite');
    }

    if (!campsite.id) {
      throw new ApolloError('There was an error saving the new campsite');
    }

    return { campsite };
  }

  @Query(() => [Campsite])
  @UseMiddleware(isAuth)
  async allCampsites(@Ctx() { req }: MyContext) {
    const userId = req.session.userId;
    const allCampsites = Campsite.query(
      `
      SELECT * FROM "campsite" cs 
      LEFT JOIN "camper" cm ON "cs"."id" = "cm"."campsiteId"
      WHERE "cs"."counselorId" = $1
      OR "cm"."userId" = $2
      ORDER BY "cs"."startingDate" ASC
    `,
      [userId, userId],
    );
    return allCampsites;
  }

  @Query(() => [Campsite])
  @UseMiddleware(isAuth)
  async myCampsites(@Ctx() { req }: MyContext) {
    const userId = req.session.userId;
    return Campsite.find({
      where: { counselorId: userId },
      order: { createdAt: 'ASC' },
    });
  }

  @Query(() => Campsite)
  @UseMiddleware(isAuth, isMember)
  async getCampsite(@Arg('campsiteId', () => Int) campsiteId: number) {
    const campsite = await Campsite.findOne(campsiteId);

    if (!campsite) {
      throw new ApolloError('Campsite not found.');
    }

    return campsite;
  }
}
