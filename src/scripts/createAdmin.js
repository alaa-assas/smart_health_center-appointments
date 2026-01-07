require("dotenv").config();
const User = require("../models/User");
const connectDB = require("../utils/connectDB");
const passwordService = require("../utils/passwordService")

const createAdminUser = async () => {
    try {
        await connectDB();

        const adminData = {
            email: process.env.ADMIN_EMAIL,
            fullName: process.env.ADMIN_NAME,
            phone: "+963111111111",
            dateOfBirth: new Date("1991-01-01"),
            address: "Damascus, syria",
            role: "admin"
        }

        const existedAdmin = await User.findOne({ role: "admin" });
        if(existedAdmin) {
            console.error("Admin is already exist");
            process.exit(1);
        }

        await User.create({
            ...adminData,
            passwordHash: await passwordService.hashPassword(process.env.ADMIN_PASS)
        });

        console.log("Admin is Created Successfully");
        process.exit(0);
    } catch (error) {
        console.error("Error Creating Admin User:", error.message)
        process.exit(1);
    }
}

createAdminUser();