import * as Yup from 'yup';

const campsiteNameValidator = Yup.string()
  .min(3, 'Campsite name cannot be less than 3 characters')
  .max(50, 'Campsite name cannot be more than 30 characters')
  .required('You must provide a category name');

const startingDateValidator = Yup.date()
  .min(new Date(), 'Starting date must be in the future')
  .required('You must provide a starting date');
const endingDateValidator = Yup.date()
  .min(new Date(), 'Ending date must be in the future')
  .required('You must provide an ending date');

export const NewCampsiteSchema = Yup.object().shape({
  name: campsiteNameValidator,
  startingDate: startingDateValidator,
  endingDate: endingDateValidator,
});
