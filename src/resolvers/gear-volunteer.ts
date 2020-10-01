import { ApolloError } from 'apollo-server-express';
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
import { Gear } from '../entities/Gear';
import { GearVolunteer } from '../entities/GearVolunteer';
import { isAuth } from '../middleware/isAuth';
import { MyContext } from '../types';
import { FieldError } from './user';

@InputType()
class VolunteerGearInput {
  @Field()
  gearId: number;

  @Field()
  volunteerAmount: number;
}

@ObjectType()
class GearVolunteerResponse {
  @Field(() => GearVolunteer, { nullable: true })
  gearVolunteer?: GearVolunteer;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
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
    // Prevent user from volunteering twice
    const alreadyVolunteered = await GearVolunteer.findOne({
      where: { gearId: input.gearId, userId: req.session.userId },
    });

    if (alreadyVolunteered)
      throw new ApolloError('Cannot volunteer for the same gear twice');

    // Prevent user from volunteering more than total needed
    const gear = await Gear.findOne({ where: { id: input.gearId } });
    const allVolunteers = await GearVolunteer.find({
      where: { gearId: input.gearId },
    });
    const totalVolunteered = allVolunteers.reduce(
      (a, b) => a + b.volunteerAmount,
      0,
    );
    if (gear?.quantity! - totalVolunteered < input.volunteerAmount) {
      return {
        errors: [
          {
            field: 'volunteerAmount',
            message: 'Cannot volunteer more than needed',
          },
        ],
      };
    }

    const newVolunteer = GearVolunteer.create({
      ...input,
      userId: req.session.userId,
    });

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
