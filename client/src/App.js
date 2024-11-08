import React, { useState } from 'react';
import TransactionTable from './components/TransactionTable';
import TransactionStatistics from './components/TransactionStatistics';
import TransactionBarChart from './components/TransactionBarChart';

function App() {
    const [selectedMonth, setSelectedMonth] = useState('March');

    return (
        <div className='App container mt-5   p-3'>
            <h1 className='text-center mb-4 text-black display-2 text-black '>Transaction Dashboard</h1>
            <div className='row'>
                <div className='col-md-8'>
                    <TransactionTable selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
                </div>
                <div className='col-md-4'>
                    <TransactionStatistics selectedMonth={selectedMonth} />
                </div>
            </div>
            <div className='row mt-5'>
                <div className='col-12'>
                    <TransactionBarChart selectedMonth={selectedMonth} />
                </div>
            </div>
        </div>
    );
}

export default App;
