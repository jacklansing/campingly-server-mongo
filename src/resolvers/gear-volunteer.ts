import { MyContext } from '../types';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Mutation,
  ObjectType,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { GearVolunteer } from '../entities/GearVolunteer';
import { isAuth } from '../middleware/isAuth';
import { ApolloError } from 'apollo-server-express';
import { FieldError } from './user';
import { Gear } from '../entities/Gear';

@InputType()
class VolunteerGearInput {
  @Field()
  gearId: number;

  @Field()
  userId: number;

  @Field()
  volunteerAmount: number;
}

@ObjectType()
class GearVolunteerResponse {
  @Field(() => GearVolunteer, { nullable: true })
  gearVolunteer?: GearVolunteer;

  @Field(() => [FieldError], { nullable: true })
  fieldError?: FieldError[];
}

@Resolver(() => GearVolunteer)
export class GearVolunteerResolver {
  @FieldResolver()
  gear(@Root() gearVolunteer: GearVolunteer) {
    return Gear.findOne({ where: { id: gearVolunteer.gearId } });
  }

  @Mutation(() => GearVolunteerResponse)
  @UseMiddleware(isAuth)
  async volunteerGear(
    @Arg('input') input: VolunteerGearInput,
    @Ctx() { req }: MyContext,
  ): Promise<GearVolunteerResponse> {
    const alreadyVolunteered = await GearVolunteer.findOne({
      where: { gearId: input.gearId, userId: req.session.userId },
    });

    if (alreadyVolunteered)
      throw new ApolloError('Cannot volunteer for the same gear twice');

    const newVolunteer = GearVolunteer.create({ ...input });

    try {
      await newVolunteer.save();
    } catch (e) {
      console.error('Error saving new gear volunteer amount', e);
    }

    if (!newVolunteer.createdAt) {
      throw new ApolloError(
        'There was an error saving the new volunteer amount',
      );
    }

    return { gearVolunteer: newVolunteer };
  }
}
