import * as Yup from 'yup';

const usernameValidator = Yup.string()
  .min(4, 'Username cannot be less than 4 characters')
  .max(15, 'Username cannot be more than 15 characters')
  .matches(
    /^[a-zA-Z0-9_]*$/,
    'Username may only contain letters, numbers, and underscores',
  )
  .required();

const passwordValidator = Yup.string()
  .min(8, 'Password cannot be less than 8 characters')
  .max(30, 'Password cannot be more than 30 characters')
  .matches(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{3,}$/gm,
    'Password must contain at least 1 uppercase letter, 1 lowercase letter, and a number',
  )
  .required();

const emailValidator = Yup.string()
  .email('Must provide a valid e-mail address')
  .required();

export const RegisterSchema = Yup.object().shape({
  username: usernameValidator,
  password: passwordValidator,
  email: emailValidator,
});

export const PasswordResetSchema = Yup.object().shape({
  password: passwordValidator,
});
