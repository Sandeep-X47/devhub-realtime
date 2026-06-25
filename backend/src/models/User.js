import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    avatarColor: { type: String, default: '#22d3ee' },
  },
  { timestamps: true }
);

// Hash the password whenever it is set via the virtual `password` field.
userSchema.virtual('password').set(function (plain) {
  this._plainPassword = plain;
});

// Hash in pre('validate') — this runs BEFORE validation, so passwordHash
// exists by the time the `required` check fires. (pre('save') is too late.)
userSchema.pre('validate', async function () {
  if (this._plainPassword) {
    this.passwordHash = await bcrypt.hash(this._plainPassword, 12);
  }
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

// Never leak the hash to the client.
userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatarColor: this.avatarColor,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);