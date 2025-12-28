const notFound = (req, res) => res.status(404).json({
    success: false,
    message: "Not Found"
})

module.exports = notFound