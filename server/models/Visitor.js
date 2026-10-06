const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    passId: {
      type: String,
      unique: true,
    },
    visitorName: {
      type: String,
      required: [true, 'Visitor Name is required'],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile Number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email Address is required'],
      trim: true,
      lowercase: true,
    },
    organization: {
      type: String,
      required: [true, 'Organization or College Name is required'],
      trim: true,
    },
    personToMeet: {
      type: String,
      required: [true, 'Person to Meet is required'],
      trim: true,
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of Visit is required'],
      trim: true,
    },
    visitDateTime: {
      type: Date,
      default: Date.now,
      required: [true, 'Date and Time of Visit is required'],
    },
    checkOutDateTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Checked In', 'Checked Out'],
      default: 'Checked In',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate unique Visitor Pass ID
visitorSchema.pre('save', async function (next) {
  if (!this.passId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.passId = `VIS-${new Date().getFullYear()}-${randomSuffix}`;
  }
  next();
});

module.exports = mongoose.model('Visitor', visitorSchema);
