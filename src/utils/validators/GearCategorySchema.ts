import * as Yup from 'yup';

const gearCategoryValidator = Yup.string()
  .min(3, 'Category name cannot be less than 3 characters')
  .max(50, 'Category name cannot be more than 30 characters')
  .required('You must provide a category name');

export const NewGearCategorySchema = Yup.object().shape({
  category: gearCategoryValidator,
});
