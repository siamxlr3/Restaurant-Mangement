const testService = require('../services/test.service');
const { sendResponse, sendError } = require('../utils/apiResponse');

const getTestData = async (req, res, next) => {
    try {
        const data = await testService.fetchTestData();
        return sendResponse(res, 200, true, 'Test data fetched successfully', data);
    } catch (error) {
        next(error);
    }
};

const createTestData = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name) {
            return sendError(res, 400, 'Name is required');
        }
        const data = await testService.saveTestData(name);
        return sendResponse(res, 201, true, 'Test data created successfully', data);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTestData,
    createTestData,
};
