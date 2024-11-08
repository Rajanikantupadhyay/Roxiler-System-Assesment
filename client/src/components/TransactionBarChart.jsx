import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import { Chart, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
// Register necessary components with Chart.js
Chart.register(CategoryScale, LinearScale, BarElement, Title);

const TransactionBarChart = ({ selectedMonth }) => {
    const [barData, setBarData] = useState([]);

    useEffect(() => {
        fetchBarChartData();
    }, [selectedMonth]);

    const fetchBarChartData = async () => {
        try {
            const response = await axios.get('http://localhost:3100/api/transactions/bar-chart', {
                params: { month: selectedMonth }
            });
            setBarData(response.data.data);
        } catch (error) {
            console.error('Error fetching bar chart data:', error);
        }
    };

    const data = {
        labels: barData.map((item) => item.range),
        datasets: [
            {
                label: 'Number of Items',
                data: barData.map((item) => item.count),
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }
        ]
    };

    const options = {
        scales: {
            y: { beginAtZero: true }
        }
    };

    return (
        <div className='card text-black'>
            <div className='card-body'>
                <h3 className='card-title text-black'>Bar Chart Stats - {selectedMonth}</h3>
                <Bar data={data} options={options} />
            </div>
        </div>
    );
};

export default TransactionBarChart;