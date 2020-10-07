import { ApolloError } from 'apollo-server-express';
import { Gear } from '../entities/Gear';
import {
  Arg,
  Field,
  FieldResolver,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { Campsite } from '../entities/Campsite';
import { GearCategory } from '../entities/GearCategory';
import { isAuth } from '../middleware/isAuth';
import { isCounselor } from '../middleware/isCounselor';
import { ErrorMessage, FieldError } from './user';
import { NewGearCategorySchema } from 'src/utils/validators/GearCategorySchema';
import { useValidationSchema } from 'src/utils/validators/useValidationSchema';

@ObjectType()
class GearCategoryResponse {
  @Field(() => GearCategory, { nullable: true })
  gearCategory?: GearCategory;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
class GetCategoriesResponse {
  @Field(() => [GearCategory], { nullable: true })
  gearCategories?: GearCategory[];

  @Field(() => [ErrorMessage], { nullable: true })
  errors?: ErrorMessage[];
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
  ): Promise<GearCategoryResponse> {
    const campsite = await Campsite.findOne(campsiteId);
    if (!campsite) {
      throw new ApolloError('Invalid Campsite');
    }

    const { errors } = await useValidationSchema(
      { category },
      NewGearCategorySchema,
    );
    if (errors) return { errors };

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

  @Query(() => GetCategoriesResponse)
  @UseMiddleware(isAuth)
  async getCategories(
    @Arg('campsiteId', () => Int) campsiteId: number,
  ): Promise<GetCategoriesResponse> {
    const categories = await GearCategory.find({ where: { campsiteId } });
    if (!categories.length) {
      return {
        errors: [
          {
            message: 'No categories exist for this campsite.',
          },
        ],
      };
    }

    return { gearCategories: categories };
  }
}
