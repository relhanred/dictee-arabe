'use client';
import { useEffect, useState } from "react";
import { db } from "@/app/firebase";
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import DictationForm from "@/app/components/DictationForm";
import Table from "@/app/components/Table";
import Modal from '@/app/components/Modal';
import { useFlash } from '@/app/contexts/FlashContext';

export default function AdminPage() {
    const [dictations, setDictations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDictation, setEditingDictation] = useState(null);
    const { showFlash } = useFlash();

    useEffect(() => {
        const dictationsRef = collection(db, 'dictations');
        const q = query(dictationsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const dictationsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
            setDictations(dictationsData);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching dictations:', error);
            showFlash('Erreur lors de la récupération des dictées.', 'error');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleFormSuccess = () => {
        setIsModalOpen(false);
        setEditingDictation(null);
    };

    const handleEdit = (dictation) => {
        setEditingDictation(dictation);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-screen-xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Dictées</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                    Ajouter dictée
                </button>
            </div>

            <Table
                dictations={dictations}
                onEdit={handleEdit}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingDictation(null);
                }}
                title={editingDictation ? "Modifier la dictée" : "Ajouter une nouvelle dictée"}
                size="md"
            >
                <DictationForm
                    onSuccess={handleFormSuccess}
                    initialData={editingDictation}
                />
            </Modal>

        </div>
    );
}