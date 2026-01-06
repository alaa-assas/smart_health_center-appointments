const argon2 = require("argon2");

class PasswordService {
    async hashPassword(password) {
        try {
            return await argon2.hash(password, {
                type: argon2.argon2id,
                memoryCost: 2 ** 16, // 64MB
                timeCost: 3,
                parallelism: 1,
                hashLength: 32
            })
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async verifyPassword(password, hashedPassword) {
        try {
            return await argon2.verify(hashedPassword, password);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    validatePasswordStrength(password) {
        if (typeof password !== 'string') {
            throw new Error('Password must be a string');
        }
        
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password); // A - Z
        const hasLowerCase = /[a-z]/.test(password); // a - z
        const hasNumbers = /\d/.test(password);  // 1,2,3,...
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password); //
        
        const errors = [];
        
        if (password.length < minLength) errors.push('must be at least 8 characters long');
        if (!hasUpperCase) errors.push('must contain uppercase letters');
        if (!hasLowerCase) errors.push('must contain lowercase letters');
        if (!hasNumbers) errors.push('must contain numbers');
        if (!hasSpecialChar) errors.push('must contain special characters');
        
        if (errors.length > 0) {
            throw new Error(`Password ${errors.join(', ')}`);
        }
        
        return true;
    }
}

module.exports = new PasswordService();