import mongoose, { Schema } from 'mongoose';
import { ICampsiteDocument } from 'src/resolvers/types/campsite.types';

const campsiteSchema = new Schema(
  {
    name: { type: String, required: true, unique: false },
    startingDate: { type: Date, required: true, unique: false },
    endingDate: { type: Date, required: true, unique: false },
    manager: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
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

export default mongoose.model<ICampsiteDocument>('Campsite', campsiteSchema);
