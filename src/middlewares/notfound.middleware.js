const collection = require("../utils/collection");

const notFound = (req, res) => {
  return res.status(404).json(
    collection(false, "Route not found", null, "NOT_FOUND")
  );
};

module.exports = notFound;