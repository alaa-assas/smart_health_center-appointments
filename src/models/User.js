const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
            email: {
                type: String,
                required: true,
                unique: true,
                lowercase: true,
                trim: true,
                match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
            },

            passwordHash: {
                type: String,
                required: true
            },

            fullName: {
                type: String,
                trim: true
            },

            phone: {
                type: String,
                trim: true,
                match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Please enter a valid phone']
            },

            dateOfBirth: {
                type: Date,
                validate: {
                    validator: function (value) {
                        // Check that the date of birth is not in the future
                        return value <= new Date();
                    },
                    message: 'the birthday cannot be in the future.'
                }
            },

            address: {
                type: String,
                trim: true
            },

            role: {
                type: String,
                required: true,
                enum: ['patient', 'doctor', 'admin'],
                default: 'patient'
            },

            isActive: {
                type: Boolean,
                default: true
            },

            // Locked after many failed Attempts
            isLocked: {
                type: Boolean,
                default: false
            },
            lockedUntil: Date,
            failedLoginAttempts: {
                type: Number,
                default: 0
            },

            //Relations
            doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor"},
        },
        {
            timestamps: true,
        }
    )
;

// Add an index to frequently searched fields
userSchema.index({email: 1});
userSchema.index({role: 1});
userSchema.index({isActive: 1});

// virtual property for calc age
userSchema.virtual('age').get(function () {
    if (!this.dateOfBirth) return null;

    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0) {
        age--;
    }

    return age;
});


userSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
    }
});


const User = mongoose.model("User", userSchema);

module.exports = User;
