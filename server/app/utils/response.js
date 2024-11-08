module.exports = {
    success: (message, data, res) => {
        res.status(200).json({
            message: message,
            data: data,
            isSuccess: true
        });
        res.end();
    },
    failure: (err, res) => {
        res.status(500).json({
            message: err.message,
            data: 0,
            isSuccess: false
        });
        res.end();
    },
    badRequest: (message, res) => {
        res.status(400).json({
            message: message,
            data: 0,
            isSuccess: false
        });
        res.end();
    },
    unAuthorized: (res) => {
        res.status(401).json({
            message: 'You are not authorized to access the request!',
            data: 0,
            isSuccess: false
        });
        res.end();
    }
};
