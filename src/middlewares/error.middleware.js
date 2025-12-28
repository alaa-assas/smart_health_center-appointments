const handleError = (err, req, res, next) => {
    const status = 500;
    const message = err.message || 'Internal Server Error';    
    
    return res.status(status).json({
        success: false,
        error: message,
    });
}

module.exports = handleError