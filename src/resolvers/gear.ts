import { ApolloError } from 'apollo-server-express';
import { GearVolunteer } from '../entities/GearVolunteer';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { Gear } from '../entities/Gear';
import { GearCategory } from '../entities/GearCategory';
import { isAuth } from '../middleware/isAuth';
import { ErrorMessage, FieldError } from './user';
import { isCounselor } from '../middleware/isCounselor';
import { isMember } from '../middleware/isMember';
import { MyContext } from '../types';
import { useValidationSchema } from '../utils/validators/useValidationSchema';
import { AddGearSchema } from '../utils/validators/GearSchemas';

@InputType()
class GearInput {
  @Field()
  name: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Int)
  gearCategoryId: number;
}

@ObjectType()
class GearResponse {
  @Field(() => Gear, { nullable: true })
  gear?: Gear;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@Resolver(() => Gear)
export class GearResolver {
  @FieldResolver()
  gearCategory(@Root() gear: Gear) {
    return GearCategory.findOne({ where: { id: gear.gearCategoryId } });
  }

  @FieldResolver()
  gearVolunteers(@Root() gear: Gear) {
    return GearVolunteer.find({ where: { gearId: gear.id } });
  }

  @FieldResolver(() => Boolean)
  async userHasVolunteered(@Root() gear: Gear, @Ctx() { req }: MyContext) {
    const volunteer = await GearVolunteer.findOne({
      where: { gearId: gear.id, userId: req.session.userId },
    });
    return !!volunteer;
  }

  @Mutation(() => GearResponse)
  @UseMiddleware(isAuth)
  @UseMiddleware(isMember)
  async addGear(@Arg('input') input: GearInput): Promise<GearResponse> {
    const { errors } = await useValidationSchema(input, AddGearSchema);

    if (errors) return { errors };

    const categoryExists = await GearCategory.findOne({
      where: { id: input.gearCategoryId },
    });

    if (!categoryExists) throw new ApolloError('Category does not exist');

    const newGear = Gear.create({ ...input });

    try {
      await newGear.save();
    } catch (e) {
      console.error('There was an issue saving the new gear', e);
    }

    if (!newGear.id) {
      throw new ApolloError('There was an error saving the new gear');
    }

    return { gear: { ...newGear } as Gear };
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  @UseMiddleware(isCounselor)
  async deleteGear(
    @Arg('gearId', () => Int) gearId: number,
    @Arg('gearCategoryId', () => Int) gearCategoryId: number,
  ): Promise<boolean | ErrorMessage[]> {
    try {
      await Gear.delete({ id: gearId, gearCategoryId });
    } catch {
      throw new ApolloError('There was an error deleting the gear');
    }
    return true;
  }
}
