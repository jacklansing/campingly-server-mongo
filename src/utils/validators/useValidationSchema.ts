import { ValidationError } from 'apollo-server-express';
import { ObjectSchema } from 'yup';
import { FieldError } from '../../resolvers/user';

export const useValidationSchema = async (
  values: object,
  Schema: ObjectSchema,
) => {
  try {
    await Schema.validate(values, {
      abortEarly: false,
    });
    return { errors: null };
  } catch (e) {
    const errors: FieldError[] = [];
    e?.inner?.forEach((e: ValidationError) => {
      errors.push({
        field: e.path,
        message: e.message,
      });
    });
    return { errors };
  }
};
