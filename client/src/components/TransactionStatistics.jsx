import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TransactionStatistics = ({ selectedMonth }) => {
    const [statistics, setStatistics] = useState({ totalSaleAmount: 0, soldItemsCount: 0, unsoldItemsCount: 0 });

    useEffect(() => {
        fetchStatistics();
    }, [selectedMonth]);

    const fetchStatistics = async () => {
        try {
            const response = await axios.get('http://localhost:3100/api/transactions/statistics', {
                params: { month: selectedMonth }
            });
            setStatistics(response.data.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    return (
        <div className='card bg-secondary  '>
            <div className='card-body '>
                <h3 className='card-title text-white '>Statistics - {selectedMonth}</h3>
                <ul className='list-group'>
                    <li className='list-group-item d-flex justify-content-between'>
                        <span>Total Sale:</span> <span>{statistics.totalSaleAmount}</span>
                    </li>
                    <li className='list-group-item d-flex justify-content-between'>
                        <span>Total Sold Items:</span> <span>{statistics.soldItemsCount}</span>
                    </li>
                    <li className='list-group-item d-flex justify-content-between'>
                        <span>Total Not Sold Items:</span> <span>{statistics.unsoldItemsCount}</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default TransactionStatistics;