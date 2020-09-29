import { ApolloError } from 'apollo-server-express';
import { GearVolunteer } from '../entities/GearVolunteer';
import {
  Arg,
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
import { ErrorMessage } from './user';

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

  @Field(() => [ErrorMessage], { nullable: true })
  errors?: ErrorMessage[];
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

  @Mutation(() => GearResponse)
  @UseMiddleware(isAuth)
  async addGear(@Arg('input') input: GearInput): Promise<GearResponse> {
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
}
