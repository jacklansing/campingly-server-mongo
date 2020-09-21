import { ApolloError } from 'apollo-server-express';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Mutation,
  ObjectType,
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

@ObjectType()
class CampsiteResponse {
  @Field(() => Campsite, { nullable: true })
  campsite?: Campsite;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
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

  @Mutation(() => CampsiteResponse)
  @UseMiddleware(isAuth)
  async createCampsite(
    @Arg('name') name: string,
    @Ctx() { req }: MyContext,
  ): Promise<CampsiteResponse> {
    const alreadyUsed = await Campsite.findOne({
      where: { name, counselorId: req.session.userId },
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

    const campsite = Campsite.create({ name, counselorId: req.session.userId });

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
}
