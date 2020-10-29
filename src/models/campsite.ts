import mongoose, { Schema } from 'mongoose';

const campsiteSchema = new Schema(
  {
    name: { type: String, required: true, unique: false },
    startingDate: { type: Date, required: true, unique: false },
    endingDate: { type: Date, required: true, unique: false },
    manager: {
      id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
      displayName: { type: String },
    },
    counselors: [
      {
        id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
      },
    ],
    campers: [
      {
        id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
      },
    ],
    gearCategories: [
      {
        category: String,
        gear: [
          {
            name: String,
            quantity: Number,
            volunteers: [
              {
                userId: {
                  type: Schema.Types.ObjectId,
                  required: true,
                  ref: 'User',
                },
                volunteerAmount: Number,
              },
            ],
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model('Campsite', campsiteSchema);
