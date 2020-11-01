import mongoose, { Schema } from 'mongoose';
import { IUserDocument } from 'src/resolvers/types/user.types';

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    displayName: { type: String, required: true, unique: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, unique: false },
    userCampsites: [{ type: Schema.Types.ObjectId, ref: 'Campsite' }],
    memberCampsites: [{ type: Schema.Types.ObjectId, ref: 'Campsite' }],
  },
  { timestamps: true },
);

export default mongoose.model<IUserDocument>('User', userSchema);
