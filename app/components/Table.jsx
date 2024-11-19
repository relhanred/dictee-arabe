import React, { useState } from 'react';
import AudioPlayer from "@/app/components/AudioPlayer";

const Table = ({ dictations = [] }) => {
    const [sortConfig, setSortConfig] = useState({
        key: 'createdAt',
        direction: 'desc'
    });
    const [filters, setFilters] = useState({
        content: '',
        letter: '',
        type: ''
    });

    // Sorting function
/*    const sortData = (data) => {
        return [...data].sort((a, b) => {
            if (sortConfig.key === 'createdAt') {
                const dateA = new Date(a[sortConfig.key]);
                const dateB = new Date(b[sortConfig.key]);
                return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
            }

            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };*/

    // Filtering function
/*    const filterData = (data) => {
        return data.filter(item => {
            return (
                item.content.toLowerCase().includes(filters.content.toLowerCase()) &&
                item.letter.toLowerCase().includes(filters.letter.toLowerCase()) &&
                item.type.toLowerCase().includes(filters.type.toLowerCase())
            );
        });
    };*/

    // Handle sort
/*    const handleSort = (key) => {
        setSortConfig({
            key,
            direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
        });
    };*/

    // Format date
    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };


/*
    const filteredAndSortedData = sortData(filterData(dictations));
*/

    return (
        <div className="w-full p-4">
            <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">
                            <button
                                className="flex items-center justify-between w-full"
                            >
                                Type
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-3">
                            <button
                                className="flex items-center justify-between w-full"
                            >
                                Contenu
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-3">
                            <button
                                className="flex items-center justify-between w-full"
                            >
                                Lettre
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Audio
                        </th>
                        <th scope="col" className="px-6 py-3">
                            <button
                                className="flex items-center justify-between w-full"
                            >
                                Date de création
                            </button>
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {dictations.map((row, index) => (
                        <tr
                            key={index}
                            className="bg-white border-b hover:bg-gray-50"
                        >
                            <td className="px-6 py-4 w-20">{row.type}</td>
                            <td className="px-6 py-4 min-w-96 font-medium text-gray-900">
                                {row.content}
                            </td>
                            <td className="px-6 py-4 w-10">{row.letter}</td>
                            <td className="px-6 py-4 w-72">
                                <AudioPlayer audio={row.audioUrl}/>
                            </td>
                            <td className="px-6 py-4 w-40">{formatDate(row.createdAt)}</td>

                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Table;