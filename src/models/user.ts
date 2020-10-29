import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    displayName: { type: String, required: true, unique: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, unique: false },
    campsites: [
      {
        id: { type: Schema.Types.ObjectId, ref: 'Campsite' },
        name: String,
        startingDate: Date,
        endingDate: Date,
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model('User', userSchema);
