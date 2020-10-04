import * as Yup from 'yup';

const gearNameValidator = Yup.string()
  .min(3, 'Gear name cannot be less than 4 characters')
  .max(30, 'Gear name cannot be more than 30 characters')
  .required('You must provide a label');

const gearQuantityValidator = Yup.number()
  .min(1, 'Quantity cannot be less than 1')
  .max(99, 'Quantity cannot be more than 99')
  .required('You must provide an amount');

export const AddGearSchema = Yup.object().shape({
  name: gearNameValidator,
  quantity: gearQuantityValidator,
});
