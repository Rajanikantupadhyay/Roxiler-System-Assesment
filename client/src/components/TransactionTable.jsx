import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TransactionTable = ({ selectedMonth, setSelectedMonth }) => {
    const [transactions, setTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchTransactions();
    }, [selectedMonth, searchTerm, page]);

    const fetchTransactions = async () => {
        try {
            const response = await axios.get('http://localhost:3100/api/transactions', {
                params: {
                    month: selectedMonth,
                    search: searchTerm,
                    page: page,
                    perPage: 10
                }
            });
            setTransactions(response.data.data.transactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    return (
        <div className='card bg-secondary'>
            <div className='card-body '>
            <h2 className='card-title text-white'>Transactions</h2>
                <div className='d-flex mb-3'>
                    <input 
                        type='text'
                        className='form-control me-2'
                        placeholder='Search transaction'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select className='form-select' value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                        {[
                            'January',
                            'February',
                            'March',
                            'April',
                            'May',
                            'June',
                            'July',
                            'August',
                            'September',
                            'October',
                            'November',
                            'December'
                        ].map((month) => (
                            <option key={month} value={month}>
                                {month}
                            </option>
                        ))}
                    </select>
                </div>
                <table className='table table-striped'>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Price</th>
                            <th>Category</th>
                            <th>Sold</th>
                            <th>Image</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((transaction) => (
                            <tr key={transaction.id}>
                                <td>{transaction.id}</td>
                                <td>{transaction.title}</td>
                                <td>{transaction.description}</td>
                                <td>{transaction.price}</td>
                                <td>{transaction.category}</td>
                                <td>{transaction.sold ? 'Yes' : 'No'}</td>
                                <td>
                                    <img src={transaction.image} alt={transaction.title} width='50' />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className='d-flex justify-content-between'>
                    <button className='btn btn-white bg-white' onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>
                        Previous
                    </button>
                    <span>Page No: {page}</span>
                    <button className='btn btn-white bg-white' onClick={() => setPage((prev) => prev + 1)}>
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransactionTable;