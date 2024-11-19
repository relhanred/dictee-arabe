'use client';
import { useEffect, useState } from "react";
import { db } from "@/app/firebase";
import { collection, query, orderBy, getDocsn , onSnapshot } from 'firebase/firestore';
import DictationForm from "@/app/components/DictationForm";
import Table from "@/app/components/Table";
import {useFlash} from "@/app/contexts/FlashContext";

export default function AdminPage() {
    const [dictations, setDictations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
            showFlash('Erreur lor', 'error');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleFormSuccess = () => {
        setIsModalOpen(false);
        showFlash('Dictée ajoutée !');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-7xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Dictées</h1>
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

            <Table dictations={dictations} />

            {isModalOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={() => setIsModalOpen(false)}
                    />

                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-colors duration-200"
                                >
                                    <svg
                                        className="h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>

                                <div className="mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Ajouter une nouvelle dictée
                                    </h2>
                                </div>

                                <div className="mt-4">
                                    <DictationForm onSuccess={handleFormSuccess} />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}