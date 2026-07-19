// src/models/User.ts
import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  password_hash: string;
  role: "super_admin" | "admin" | "staff";
  is_active: boolean;
  last_login?: Date;
  refresh_token?: string;
  created_at: Date;
  updated_at: Date;
  full_name?: string; // virtual property
  
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    user_id: {
      type: String,
      required: true,
      unique: true, // This already creates an index
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // This already creates an index
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
    },
    password_hash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "staff"],
      required: true,
      default: "staff",
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    last_login: {
      type: Date,
    },
    refresh_token: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Only define additional indexes that aren't already covered by schema options
// Remove the duplicate index definitions for email and user_id since they already have unique: true
UserSchema.index({ role: 1 });
UserSchema.index({ is_active: 1 });

// Virtual for full name
UserSchema.virtual("full_name").get(function() {
  return this.name;
});

// Hash password before saving - FIXED for Mongoose 9
UserSchema.pre<IUser>("save", async function(this: IUser) {
  const user = this;

  // If password hash hasn't changed, skip hashing
  if (!user.isModified("password_hash")) {
    return;
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  user.password_hash = await bcrypt.hash(user.password_hash, salt);
});

// Compare password method - FIXED for Mongoose 9
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// JSON transforms - FIXED for Mongoose 9
UserSchema.set("toJSON", {
  virtuals: true,
  transform: function(_doc, ret) {
    // Explicitly create a new object with only safe fields
    const safeObject = {
      _id: ret._id,
      user_id: ret.user_id,
      name: ret.name,
      email: ret.email,
      phone: ret.phone,
      role: ret.role,
      is_active: ret.is_active,
      last_login: ret.last_login,
      created_at: ret.created_at,
      updated_at: ret.updated_at,
      full_name: ret.full_name,
    };
    return safeObject;
  },
});

UserSchema.set("toObject", {
  virtuals: true,
  transform: function(_doc, ret) {
    const safeObject = {
      _id: ret._id,
      user_id: ret.user_id,
      name: ret.name,
      email: ret.email,
      phone: ret.phone,
      role: ret.role,
      is_active: ret.is_active,
      last_login: ret.last_login,
      created_at: ret.created_at,
      updated_at: ret.updated_at,
      full_name: ret.full_name,
    };
    return safeObject;
  },
});

// Export model
const User = mongoose.models.User as mongoose.Model<IUser> || 
  mongoose.model<IUser>("User", UserSchema);

export default User;