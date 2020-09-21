import { Gear } from '../entities/Gear';
import {
  Arg,
  Ctx,
  Mutation,
  Resolver,
  InputType,
  Field,
  UseMiddleware,
  Int,
  FieldResolver,
  Root,
} from 'type-graphql';
import { MyContext } from '../types';
import { GearCategory } from '../entities/GearCategory';
import { ApolloError } from 'apollo-server-express';
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
  async addGear(@Arg('input') input: GearInput, @Ctx() { req }: MyContext) {
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

    return { ...newGear };
  }
}
