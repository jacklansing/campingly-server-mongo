import { GearCategory } from '../entities/GearCategory';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Int,
  Mutation,
  ObjectType,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { Campsite } from '../entities/Campsite';
import { FieldError } from './user';
import { Gear } from '../entities/Gear';
import { UserInputError, ApolloError } from 'apollo-server-express';
import { isCounselor } from '../middleware/isCounselor';

@ObjectType()
class GearCategoryResponse {
  @Field(() => GearCategory, { nullable: true })
  gearCategory?: GearCategory;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@Resolver(() => GearCategory)
export class GearCategoryResolver {
  @FieldResolver()
  gears(@Root() gearCategory: GearCategory) {
    return Gear.find({ where: { gearCategoryId: gearCategory.id } });
  }

  @FieldResolver()
  campsite(@Root() gearCategory: GearCategory) {
    return Campsite.findOne({ where: { id: gearCategory.campsiteId } });
  }

  @Mutation(() => GearCategoryResponse)
  @UseMiddleware(isAuth)
  @UseMiddleware(isCounselor)
  async createGearCategory(
    @Arg('category') category: string,
    @Arg('campsiteId', () => Int) campsiteId: number,
    @Ctx() { req }: MyContext,
  ): Promise<GearCategoryResponse> {
    const campsite = await Campsite.findOne(campsiteId);
    if (!campsite) {
      throw new UserInputError('Invalid Campsite');
    }

    const alreadyUsed = await GearCategory.findOne({
      where: { campsiteId: campsite.id, category },
    });

    if (alreadyUsed) {
      return {
        errors: [
          {
            field: 'category',
            message: 'There is already a category with this name',
          },
        ],
      };
    }

    const newCategory = GearCategory.create({
      category,
      campsiteId: campsite.id,
    });

    try {
      await newCategory.save();
    } catch (e) {
      console.error('There was an error saving the new category', e);
    }

    // Should have id from database
    if (!newCategory.id) {
      throw new ApolloError('There was an error saving the new category');
    }

    return { gearCategory: newCategory };
  }
}
