import { ValidationError } from 'apollo-server-express';
import { FieldError } from '../../resolvers/types/shared.types';
import { ObjectSchema } from 'yup';

/**
 * Compares a set of given values against the provided yup schema. Returns errors in a consistent format as a field error array.
 * @param values The values to compare against the schema.
 * @param Schema The Object Schema from yup
 */
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
