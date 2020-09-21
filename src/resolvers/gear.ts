import { ApolloError } from 'apollo-server-express';
import {
  Arg,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { Gear } from '../entities/Gear';
import { GearCategory } from '../entities/GearCategory';
import { isAuth } from '../middleware/isAuth';

@InputType()
class GearInput {
  @Field()
  name: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Int)
  gearCategoryId: number;
}

@Resolver(() => Gear)
export class GearResolver {
  @FieldResolver()
  gearCategory(@Root() gear: Gear) {
    return GearCategory.findOne({ where: { id: gear.gearCategoryId } });
  }

  @Mutation(() => Gear)
  @UseMiddleware(isAuth)
  async addGear(@Arg('input') input: GearInput) {
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

    return { ...newGear };
  }
}
