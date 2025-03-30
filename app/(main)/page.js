'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/app/firebase';
import AudioPlayer from '@/app/components/AudioPlayer';

const DIFFICULTY_LEVELS = [
    { id: 'Facile', label: 'Facile' },
    { id: 'Moyen', label: 'Moyen' },
    { id: 'Difficile', label: 'Difficile' },
];

const ARABIC_LETTERS = [
    { label: 'ب', index: 0 },
    { label: 'ت', index: 1 },
    { label: 'د', index: 2 },
    { label: 'ر', index: 3 },
    { label: 'ك', index: 4 },
    { label: 'س', index: 5 },
    { label: 'ل', index: 6 },
    { label: 'ج', index: 7 },
    { label: 'م', index: 8 },
    { label: 'ح', index: 9 },
    { label: 'خ', index: 10 },
    { label: 'ا', index: 11 },
    { label: 'و', index: 12 },
    { label: 'ي', index: 13 },
    { label: 'ن', index: 14 },
    { label: 'ه', index: 15 },
    { label: 'ث', index: 16 },
    { label: 'ق', index: 17 },
    { label: 'ش', index: 18 },
    { label: 'ف', index: 19 },
    { label: 'ز', index: 20 },
    { label: 'ط', index: 21 },
    { label: 'ع', index: 22 },
    { label: 'غ', index: 23 },
    { label: 'ذ', index: 24 },
    { label: 'ص', index: 25 },
    { label: 'ض', index: 26 },
    { label: 'ظ', index: 27 },
];

export default function Home() {
    const [step, setStep] = useState('initial');
    const [selectedDifficulty, setSelectedDifficulty] = useState(null);
    const [selectedLetterIndex, setSelectedLetterIndex] = useState(null);
    const [dictation, setDictation] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDictation = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const dictationsRef = collection(db, 'dictations');
            let q;

            if (step === 'full-alphabet' && selectedDifficulty) {
                q = query(
                    dictationsRef,
                    where('type', '==', 'Texte'),
                    where('difficulty', '==', selectedDifficulty)
                );
            } else if (step === 'partial-alphabet' && selectedLetterIndex !== null) {
                q = query(
                    dictationsRef,
                    where('type', '==', 'Lettre'),
                    where('letterIndex', '<=', selectedLetterIndex)
                );
            }

            if (!q) {
                setError('Veuillez sélectionner des critères valides');
                setDictation(null);
                setLoading(false);
                return;
            }

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('Aucune dictée trouvée pour ce critère');
                setDictation(null);
                return;
            }

            const dictations = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date()
                };
            });

            if (dictations.length > 0) {
                const randomIndex = Math.floor(Math.random() * dictations.length);
                const selectedDictation = dictations[randomIndex];
                setDictation(selectedDictation);
            } else {
                setError('Aucune dictée trouvée pour ce critère');
                setDictation(null);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de la dictée:', error);
            setError('Erreur lors de la récupération de la dictée: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [step, selectedDifficulty, selectedLetterIndex]);

    useEffect(() => {
        if ((step === 'full-alphabet' && selectedDifficulty) ||
            (step === 'partial-alphabet' && selectedLetterIndex !== null)) {
            fetchDictation();
        }
    }, [step, selectedDifficulty, selectedLetterIndex, fetchDictation]);

    const handleReset = () => {
        setStep('initial');
        setSelectedDifficulty(null);
        setSelectedLetterIndex(null);
        setDictation(null);
        setError(null);
    };

    const getLetterClassName = (letterIndex) => {
        const baseClasses = "p-4 bg-white shadow-lg rounded-lg transition-all duration-200 text-2xl font-noto";

        if (hoveredIndex !== null && letterIndex <= hoveredIndex) {
            return `${baseClasses} bg-gray-100 shadow-xl scale-105`;
        }

        return baseClasses;
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {step !== 'initial' && (
                <button
                    onClick={handleReset}
                    className="mb-8 text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                    Retour
                </button>
            )}

            {step === 'initial' && (
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-center mb-8">Bienvenue sur Imlaa</h1>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <button
                            onClick={() => setStep('full-alphabet')}
                            className="p-6 bg-white shadow-lg rounded-lg hover:shadow-xl transition-shadow"
                        >
                            <h2 className="text-xl font-semibold mb-2">Je connais l&apos;alphabet arabe</h2>
                            <p className="text-gray-600">Choisissez votre niveau de difficulté</p>
                        </button>
                        <button
                            onClick={() => setStep('letter-selection')}
                            className="p-6 bg-white shadow-lg rounded-lg hover:shadow-xl transition-shadow"
                        >
                            <h2 className="text-xl font-semibold mb-2">Je suis en apprentissage</h2>
                            <p className="text-gray-600">Sélectionnez jusqu&apos;où vous en êtes dans l&apos;alphabet</p>
                        </button>
                    </div>
                </div>
            )}

            {step === 'full-alphabet' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-center mb-8">Choisissez votre niveau</h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {DIFFICULTY_LEVELS.map((level) => (
                            <button
                                key={level.id}
                                onClick={() => {
                                    setSelectedDifficulty(level.id);
                                }}
                                className="p-6 bg-white shadow-lg rounded-lg hover:shadow-xl transition-shadow"
                            >
                                <h3 className="text-xl font-semibold">{level.label}</h3>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 'letter-selection' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-center mb-8">
                        À quelle lettre êtes-vous arrivé ?
                    </h2>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-4 text-center" dir="rtl">
                        {ARABIC_LETTERS.map((letter) => (
                            <button
                                key={letter.index}
                                onClick={() => {
                                    setSelectedLetterIndex(letter.index);
                                    setStep('partial-alphabet');
                                }}
                                onMouseEnter={() => setHoveredIndex(letter.index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                className={getLetterClassName(letter.index)}
                            >
                                {letter.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {(step === 'partial-alphabet' || step === 'dictation') && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">Votre dictée</h2>

                    {loading && (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                            <p className="mt-2">Chargement de la dictée...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                            {error}
                        </div>
                    )}

                    {dictation ? (
                        <div className="space-y-4">
                            {dictation.audioUrl ? (
                                <AudioPlayer audio={dictation.audioUrl} />
                            ) : (
                                <p className="text-yellow-600">Aucun audio disponible pour cette dictée</p>
                            )}
                        </div>
                    ) : (
                        !loading && !error && <p>Aucune dictée disponible</p>
                    )}
                </div>
            )}
        </div>
    );
}