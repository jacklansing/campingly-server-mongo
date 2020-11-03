import { me } from './User/Query';
import {
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
} from './User/Mutation';

export default {
  Query: {
    me,
  },
  Mutation: {
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
  },
};
