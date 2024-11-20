import React, {useState} from 'react';
import AudioPlayer from "@/app/components/AudioPlayer";
import {db} from "@/app/firebase";
import {deleteDoc, doc} from 'firebase/firestore';
import {storage} from "@/app/firebase";
import {ref, deleteObject} from "firebase/storage";
import {useFlash} from '@/app/contexts/FlashContext';
import Modal from '@/app/components/Modal';
import {TrashIcon} from "@/app/components/icons/TrashIcon";
import {PenIcon} from "@/app/components/icons/PenIcon";
import {ChevronUpIcon} from "@/app/components/icons/ChevronUpIcon";
import {ChevronDownIcon} from "@/app/components/icons/ChevronDownIcon";

const Table = ({dictations = [], onEdit}) => {
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


    const CollapsibleContent = ({content}) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const [isOverflowing, setIsOverflowing] = useState(false);
        const contentRef = React.useRef(null);

        React.useEffect(() => {
            if (contentRef.current) {
                const element = contentRef.current;
                const lineHeight = parseInt(window.getComputedStyle(element).lineHeight);
                const height = element.scrollHeight;
                const lines = Math.round(height / lineHeight);
                setIsOverflowing(lines > 3);
            }
        }, [content]);

        return (
            <div>
                <div
                    ref={contentRef}
                    className={`text-gray-900 text-xl leading-7 rtl transition-all duration-200
                    ${isExpanded ? '' : 'line-clamp-3'}`}
                >
                    {content}
                </div>

                {isOverflowing && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors duration-200"
                    >
                        {isExpanded ? (
                            <>
                                <span>Voir moins</span>
                                <ChevronUpIcon className="size-5"/>
                            </>
                        ) : (
                            <>
                                <span>Voir plus</span>
                                <ChevronDownIcon className="size-5"/>
                            </>
                        )}
                    </button>
                )}
            </div>
        );
    };

    const [deletingDictation, setDeletingDictation] = useState(null);
    const {showFlash} = useFlash();

    const handleDelete = async () => {
        if (!deletingDictation) return;

        try {
            await deleteDoc(doc(db, "dictations", deletingDictation.id));
            const audioRef = ref(storage, deletingDictation.audioUrl);
            await deleteObject(audioRef);
            showFlash('Dictée supprimée avec succès', 'success');
        } catch (error) {
            console.error('Error deleting dictation:', error);
            showFlash('Erreur lors de la suppression', 'error');
        } finally {
            setDeletingDictation(null);
        }
    };

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
        <div className="w-full">
            <div className="overflow-x-auto relative shadow-md sm:rounded-lg border">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 bg-gray-50 border-b">
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
                        {/*                        <th scope="col" className="px-6 py-3">
                            <button
                                className="flex items-center justify-between w-full"
                            >
                                Date de création
                            </button>
                        </th>*/}
                        <th scope="col" className="px-6 py-3">
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {dictations.map((row, index) => (
                        <tr
                            key={index}
                            className="bg-white border-b hover:bg-gray-50 text-black"
                        >
                            <td className="px-6 py-4 w-20">{row.type}</td>
                            <td className="px-6 py-4 min-w-96 text-2xl text-black font-noto">
                                <CollapsibleContent content={row.content}/>
                            </td>
                            <td className="px-6 py-4 w-10 text-2xl text-black font-noto">{row.letter}</td>
                            <td className="px-6 py-4 min-w-80">
                                <AudioPlayer
                                    key={`${row.id}-${row.audioUrl}`}
                                    audio={row.audioUrl}
                                />
                            </td>
                            {/*
                            <td className="px-6 py-4 w-48">{formatDate(row.createdAt)}</td>
*/}
                            <td className="px-6 py-4 w-20">
                                <div className="flex items-center justify-center space-x-2">
                                    <button
                                        onClick={() => onEdit(row)}
                                        className="text-gray-700 hover:text-gray-900"
                                    >
                                        <PenIcon className="size-6"/>
                                    </button>
                                    <button
                                        onClick={() => setDeletingDictation(row)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <TrashIcon className="size-6"/>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={!!deletingDictation}
                onClose={() => setDeletingDictation(null)}
                title="Confirmation de suppression"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Cette action est irréversible. La dictée sera supprimée définitivement.
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setDeletingDictation(null)}
                            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                        >
                            Supprimer
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default Table;