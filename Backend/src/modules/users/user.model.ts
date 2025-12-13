import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { UserRole } from '../../config/constants';
import { env } from '../../config/env';

/**
 * User Model
 * Supports role-based users: Parent, Child, Admin
 * 
 * PRIVACY & COMPLIANCE NOTES:
 * - Passwords are hashed using bcrypt before storage
 * - Child accounts are linked to parent accounts for monitoring transparency
 * - Consent flags track explicit user/parental consent
 * - No silent monitoring - all monitoring requires explicit consent
 */

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  
  // Parent-Child relationship
  parentId?: mongoose.Types.ObjectId;  // For child accounts
  children?: mongoose.Types.ObjectId[]; // For parent accounts
  
  // Consent & Privacy (COMPLIANCE)
  consentGiven: boolean;
  consentDate?: Date;
  parentalConsent?: boolean;  // For child accounts
  
  // Account status
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: Date;
  
  // Security
  refreshTokens: string[];
  passwordChangedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  toPublicJSON(): Partial<IUser>;
}

export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByUsername(username: string): Promise<IUser | null>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: function(this: IUser) {
        // Email required only for parent and admin
        return this.role !== UserRole.CHILD;
      },
      unique: true,
      sparse: true, // Allows null values for children
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    password: {
      type: String,
      required: true,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.PARENT,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number'],
    },
    dateOfBirth: {
      type: Date,
    },
    
    // Parent-Child relationship
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    children: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    
    // Consent & Privacy
    consentGiven: {
      type: Boolean,
      default: false,
    },
    consentDate: {
      type: Date,
    },
    parentalConsent: {
      type: Boolean,
    },
    
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
    
    // Security
    refreshTokens: [{
      type: String,
      select: false,
    }],
    passwordChangedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for query optimization
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ parentId: 1, role: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(env.bcryptSaltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    
    if (!this.isNew) {
      this.passwordChangedAt = new Date();
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to return public-safe user data
userSchema.methods.toPublicJSON = function (): Partial<IUser> {
  return {
    id: this._id.toString(),
    _id: this._id,
    email: this.email,
    username: this.username,
    role: this.role,
    firstName: this.firstName,
    lastName: this.lastName,
    isActive: this.isActive,
    isVerified: this.isVerified,
    createdAt: this.createdAt,
  } as any;
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email: string): Promise<IUser | null> {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find user by username
userSchema.statics.findByUsername = function (username: string): Promise<IUser | null> {
  return this.findOne({ username });
};

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
export default User;
