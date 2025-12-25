require("dotenv").config();

const createAdminUser = async () => {
    try {

        console.log("Super Admin is Created Successfully");
        process.exit(0);
    } catch (error) {
        console.error("Error creating superadmin User:", error.message)
        process.exit(1);
    }
}

createAdminUser();