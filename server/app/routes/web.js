let express = require('express');
let router = express.Router();
let Transaction = require('../db/models/Transaction');
let resp = require('../utils/response');
let axios = require('axios');

router.get('/initialize', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const data = response.data;

        await Transaction.deleteMany();

        await Transaction.insertMany(data);

        resp.success('Database initialized successfully!', 0, res);
    } catch (error) {
        resp.failure(error, res);
    }
});

router.get('/transactions', async (req, res) => {
    try {
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10;
        const  month = req.query.month || ''
        let query = {};
        const monthNumber = new Date(`${month} 1, 2020`).getMonth() + 1;

        if(month) query['$expr'] = { $eq: [{ $month: '$dateOfSale' }, monthNumber] }
        if (search) {
            let price = parseInt(search);
            query = {
                $or: [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }]
            };
            if (!isNaN(price)) {
                query.$or.push({ price: price });
            }
        }

        const skip = (page - 1) * perPage;

        const transactions = await Transaction.find(query).skip(skip).limit(perPage);

        const totalTransactions = await Transaction.countDocuments(query);
        const totalPages = Math.ceil(totalTransactions / perPage);

        resp.success(
            'Transactions retrieved successfully!',
            {
                transactions,
                meta: {
                    totalTransactions,
                    totalPages,
                    currentPage: page,
                    perPage
                }
            },
            res
        );
    } catch (error) {
        resp.failure(error, res);
    }
});

router.get('/transactions/statistics', async (req, res) => {
    try {
        const monthName = req.query.month;
        if (!monthName) {
            return resp.badRequest('Month is required', res);
        }

        const monthNumber = new Date(`${monthName} 1, 2020`).getMonth() + 1;

        const statistics = await Transaction.aggregate([
            {
                $match: {
                    $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSaleAmount: {
                        $sum: {
                            $cond: { if: { $eq: ['$sold', true] }, then: '$price', else: 0 }
                        }
                    },
                    soldItemsCount: { $sum: { $cond: { if: { $eq: ['$sold', true] }, then: 1, else: 0 } } },
                    unsoldItemsCount: { $sum: { $cond: { if: { $eq: ['$sold', false] }, then: 1, else: 0 } } }
                }
            }
        ]);

        const result = statistics[0] || {
            totalSaleAmount: 0,
            soldItemsCount: 0,
            unsoldItemsCount: 0
        };

        resp.success(
            'Statistics retrieved successfully!',
            {
                month: monthName,
                totalSaleAmount: result.totalSaleAmount,
                soldItemsCount: result.soldItemsCount,
                unsoldItemsCount: result.unsoldItemsCount
            },
            res
        );
    } catch (error) {
        resp.failure(error, res);
    }
});

router.get('/transactions/bar-chart', async (req, res) => {
    try {
        const monthName = req.query.month;
        if (!monthName) {
            return resp.badRequest('Month is required', res);
        }

        const monthNumber = new Date(`${monthName} 1, 2020`).getMonth() + 1;

        const barChartData = await Transaction.aggregate([
            {
                $match: {
                    $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] }
                }
            },
            {
                $bucket: {
                    groupBy: '$price',
                    boundaries: [0, 101, 201, 301, 401, 501, 601, 701, 801, 901, Infinity],
                    default: '901-above',
                    output: {
                        count: { $sum: 1 }
                    }
                }
            },
            {
                $addFields: {
                    range: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$_id', 0] }, then: '0-100' },
                                { case: { $eq: ['$_id', 101] }, then: '101-200' },
                                { case: { $eq: ['$_id', 201] }, then: '201-300' },
                                { case: { $eq: ['$_id', 301] }, then: '301-400' },
                                { case: { $eq: ['$_id', 401] }, then: '401-500' },
                                { case: { $eq: ['$_id', 501] }, then: '501-600' },
                                { case: { $eq: ['$_id', 601] }, then: '601-700' },
                                { case: { $eq: ['$_id', 701] }, then: '701-800' },
                                { case: { $eq: ['$_id', 801] }, then: '801-900' },
                                { case: { $eq: ['$_id', 901] }, then: '901-above' }
                            ],
                            default: 'Unknown'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    range: 1,
                    count: 1
                }
            }
        ]);

        resp.success('Bar chart data retrieved successfully!', barChartData, res);
    } catch (error) {
        resp.failure(error, res);
    }
});

router.get('/transactions/pie-chart', async (req, res) => {
    try {
        const monthName = req.query.month;
        if (!monthName) {
            return resp.badRequest('Month is required', res);
        }

        const monthNumber = new Date(`${monthName} 1, 2020`).getMonth() + 1;

        const pieChartData = await Transaction.aggregate([
            {
                $match: {
                    $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] }
                }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: '$_id',
                    count: 1
                }
            }
        ]);

        resp.success('Pie chart data retrieved successfully!', pieChartData, res);
    } catch (error) {
        resp.failure(error, res);
    }
});

router.get('/transactions/combined', async (req, res) => {
    try {
        const monthName = req.query.month;
        if (!monthName) {
            return resp.badRequest('Month is required', res);
        }

        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10;

        const [listData, statisticsData, barChartData, pieChartData] = await Promise.all([
            Transaction.find({
                $expr: { $eq: [{ $month: '$dateOfSale' }, new Date(`${monthName} 1, 2020`).getMonth() + 1] }
            })
                .skip((page - 1) * perPage)
                .limit(perPage),
            Transaction.aggregate([
                {
                    $match: {
                        $expr: { $eq: [{ $month: '$dateOfSale' }, new Date(`${monthName} 1, 2020`).getMonth() + 1] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSaleAmount: {
                            $sum: {
                                $cond: { if: { $eq: ['$sold', true] }, then: '$price', else: 0 }
                            }
                        },
                        soldItemsCount: { $sum: { $cond: { if: { $eq: ['$sold', true] }, then: 1, else: 0 } } },
                        unsoldItemsCount: { $sum: { $cond: { if: { $eq: ['$sold', false] }, then: 1, else: 0 } } }
                    }
                }
            ]),
            Transaction.aggregate([
                {
                    $match: {
                        $expr: { $eq: [{ $month: '$dateOfSale' }, new Date(`${monthName} 1, 2020`).getMonth() + 1] }
                    }
                },
                {
                    $bucket: {
                        groupBy: '$price',
                        boundaries: [0, 101, 201, 301, 401, 501, 601, 701, 801, 901, Infinity],
                        default: '901-above',
                        output: { count: { $sum: 1 } }
                    }
                },
                {
                    $addFields: {
                        range: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ['$_id', 0] }, then: '0-100' },
                                    { case: { $eq: ['$_id', 101] }, then: '101-200' },
                                    { case: { $eq: ['$_id', 201] }, then: '201-300' },
                                    { case: { $eq: ['$_id', 301] }, then: '301-400' },
                                    { case: { $eq: ['$_id', 401] }, then: '401-500' },
                                    { case: { $eq: ['$_id', 501] }, then: '501-600' },
                                    { case: { $eq: ['$_id', 601] }, then: '601-700' },
                                    { case: { $eq: ['$_id', 701] }, then: '701-800' },
                                    { case: { $eq: ['$_id', 801] }, then: '801-900' },
                                    { case: { $eq: ['$_id', 901] }, then: '901-above' }
                                ],
                                default: 'Unknown'
                            }
                        }
                    }
                },
                { $project: { _id: 0, range: 1, count: 1 } }
            ]),
            Transaction.aggregate([
                {
                    $match: {
                        $expr: { $eq: [{ $month: '$dateOfSale' }, new Date(`${monthName} 1, 2020`).getMonth() + 1] }
                    }
                },
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        category: '$_id',
                        count: 1
                    }
                }
            ])
        ]);

        resp.success(
            'Combined data retrieved successfully!',
            {
                list: listData,
                statistics: statisticsData[0] || { totalSaleAmount: 0, soldItemsCount: 0, unsoldItemsCount: 0 },
                barChart: barChartData,
                pieChart: pieChartData
            },
            res
        );
    } catch (error) {
        resp.failure(error, res);
    }
});

module.exports = router;
