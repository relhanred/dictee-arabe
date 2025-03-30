'use client';
import { useEffect, useState } from "react";
import { db } from "@/app/firebase";
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import DictationForm from "@/app/components/DictationForm";
import Table from "@/app/components/Table";
import Modal from '@/app/components/Modal';
import { useFlash } from '@/app/contexts/FlashContext';
import { FeatherIcon } from "@/app/components/icons/FeatherIcon";

export default function TextsPage() {
    const [dictations, setDictations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDictation, setEditingDictation] = useState(null);
    const { showFlash } = useFlash();

    // Définir les colonnes spécifiques pour les textes
    const columns = [
        { key: 'difficulty', header: 'Difficulté', className: 'w-24' },
        { key: 'content', header: 'Contenu', className: 'min-w-96' },
        { key: 'audio', header: 'Audio', className: 'min-w-80' },
        { key: 'actions', header: 'Actions', className: 'w-20' }
    ];

    useEffect(() => {
        const dictationsRef = collection(db, 'dictations');
        // Filtrer pour n'avoir que les dictées de type "Texte"
        const q = query(
            dictationsRef,
            where("type", "==", "Texte"),
            orderBy('createdAt', 'desc')
        );

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
                <div className="text-lg">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-black">Textes</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 inline-flex items-center gap-x-4"
                >
                    <FeatherIcon className="size-7"/>
                    <span className="">Ajouter</span>
                </button>
            </div>

            {dictations.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow">
                    <p className="text-gray-600">Aucune dictée de type "Texte" trouvée</p>
                </div>
            ) : (
                <Table
                    dictations={dictations}
                    onEdit={handleEdit}
                    columns={columns}
                />
            )}

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