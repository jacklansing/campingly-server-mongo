import { Campsite } from '../entities/Campsite';
import {
  Arg,
  Mutation,
  ObjectType,
  Resolver,
  Field,
  Ctx,
  UseMiddleware,
  FieldResolver,
  Root,
} from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { FieldError } from './user';
import { User } from '../entities/User';

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
    return { campsite };
  }
}
