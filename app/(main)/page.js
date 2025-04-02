'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    const [showContent, setShowContent] = useState(false);
    const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
    const [dictationKey, setDictationKey] = useState(0);

    // Keep track of recently shown dictations to avoid repetition
    const recentDictationsRef = useRef([]);
    const maxRecentDictations = 10; // Adjust based on your total dictation count

    const fetchDictation = useCallback(async (autoPlayAfterFetch = false) => {
        setLoading(true);
        setError(null);
        setShowContent(false);
        setShouldAutoPlay(autoPlayAfterFetch);

        try {
            const dictationsRef = collection(db, 'dictations');
            let q;

            if ((step === 'full-alphabet' || step === 'dictation') && selectedDifficulty) {
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
                // Filter out recently shown dictations if possible
                let availableDictations = dictations.filter(
                    dict => !recentDictationsRef.current.includes(dict.id)
                );

                // If all dictations have been recently shown, reset the tracking
                if (availableDictations.length === 0) {
                    recentDictationsRef.current = [];
                    availableDictations = dictations;
                }

                // Use a weighted random selection to favor dictations that haven't been shown recently
                let selectedDictation;

                if (availableDictations.length > 1) {
                    // Use Fisher-Yates shuffle algorithm for better randomization
                    const shuffledDictations = [...availableDictations];
                    for (let i = shuffledDictations.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [shuffledDictations[i], shuffledDictations[j]] = [shuffledDictations[j], shuffledDictations[i]];
                    }

                    selectedDictation = shuffledDictations[0];
                } else {
                    selectedDictation = availableDictations[0];
                }

                // Add this dictation ID to our recent list
                recentDictationsRef.current.push(selectedDictation.id);

                // Keep only the most recent N dictations in the history
                if (recentDictationsRef.current.length > maxRecentDictations) {
                    recentDictationsRef.current.shift(); // Remove the oldest
                }

                setDictation(selectedDictation);
                setDictationKey(prevKey => prevKey + 1);
            } else {
                setError('Aucune dictée trouvée pour ce critère');
                setDictation(null);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de la dictée:', error);
            setError('Impossible de récupérer la dictée. Veuillez réessayer plus tard.');
        } finally {
            setLoading(false);
        }
    }, [step, selectedDifficulty, selectedLetterIndex]);

    const handleReset = () => {
        setStep('initial');
        setSelectedDifficulty(null);
        setSelectedLetterIndex(null);
        setDictation(null);
        setError(null);
        setShowContent(false);
        setShouldAutoPlay(false);
        // Clear the recent dictations when resetting
        recentDictationsRef.current = [];
    };

    useEffect(() => {
        if (((step === 'full-alphabet' || step === 'dictation') && selectedDifficulty) ||
            (step === 'partial-alphabet' && selectedLetterIndex !== null)) {
            fetchDictation(false);
        }
    }, [step, selectedDifficulty, selectedLetterIndex, fetchDictation]);

    const handleRevealContent = () => {
        setShowContent(true);
    };

    const handleHideContent = () => {
        setShowContent(false);
    };

    const handleNewDictation = () => {
        fetchDictation(true);
    };

    const getLetterClassName = (letterIndex) => {
        if (hoveredIndex !== null && letterIndex <= hoveredIndex) {
            return "flex items-center justify-center w-16 h-16 bg-gray-900 text-white rounded-md shadow-sm text-2xl font-noto transition-transform duration-75 hover:scale-105";
        }
        return "flex items-center justify-center w-16 h-16 bg-white border border-gray-200 text-gray-900 rounded-md text-2xl font-noto transition-colors duration-75 hover:border-gray-400";
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            {step !== 'initial' && (
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={handleReset}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors duration-100"
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
                        <span className="hidden sm:inline">Retour</span>
                    </button>

                    {(step === 'partial-alphabet' || step === 'dictation') && (
                        <button
                            onClick={handleNewDictation}
                            className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-xs sm:text-sm">Nouvelle dictée</span>
                        </button>
                    )}
                </div>
            )}

            {step === 'initial' && (
                <div className="space-y-4 sm:space-y-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-10 text-gray-900">Bienvenue sur Imlaa</h1>
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 max-w-2xl mx-auto">
                        <button
                            onClick={() => setStep('full-alphabet')}
                            className="p-4 sm:p-8 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 text-center"
                        >
                            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-gray-900">Je connais l&apos;alphabet arabe</h2>
                            <p className="text-gray-700 text-sm sm:text-base">Choisissez votre niveau de difficulté</p>
                        </button>

                        <button
                            onClick={() => setStep('letter-selection')}
                            className="p-4 sm:p-8 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 text-center"
                        >
                            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-gray-900">Je suis en apprentissage</h2>
                            <p className="text-gray-700 text-sm sm:text-base">Sélectionnez jusqu&apos;où vous en êtes dans l&apos;alphabet</p>
                        </button>
                    </div>
                </div>
            )}

            {step === 'full-alphabet' && (
                <div className="space-y-4 sm:space-y-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-8 text-gray-900">Choisissez votre niveau</h2>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 max-w-xl mx-auto">
                        {DIFFICULTY_LEVELS.map((level) => (
                            <button
                                key={level.id}
                                onClick={() => {
                                    setSelectedDifficulty(level.id);
                                    setStep('dictation');
                                }}
                                className="flex-1 py-3 sm:py-5 px-4 sm:px-8 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 text-center"
                            >
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{level.label}</h3>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 'letter-selection' && (
                <div className="space-y-4 sm:space-y-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-8 text-gray-900">
                        À quelle lettre êtes-vous arrivé ?
                    </h2>
                    <div className="bg-white p-4 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-4 justify-items-center" dir="rtl">
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
                </div>
            )}

            {(step === 'partial-alphabet' || step === 'dictation') && (
                <div className="mt-8">
                    {loading && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Chargement de votre dictée...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-lg max-w-3xl mx-auto mb-4">
                            {error}
                        </div>
                    )}

                    {dictation && !loading && (
                        <div className="max-w-3xl mx-auto">
                            <div className="bg-white sm:p-6 p-2 rounded-xl border border-gray-200 shadow-sm mb-6">
                                {dictation.audioUrl ? (
                                    <AudioPlayer
                                        key={dictationKey}
                                        audio={dictation.audioUrl}
                                        options={true}
                                        autoPlay={shouldAutoPlay}
                                    />
                                ) : (
                                    <p className="text-yellow-600 text-center">Aucun audio disponible pour cette dictée</p>
                                )}
                            </div>

                            <div className="flex justify-center mb-6 text-xs sm:text-sm">
                                {showContent ? (
                                    <button
                                        onClick={handleHideContent}
                                        className="py-2 px-6 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                        Cacher la dictée
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleRevealContent}
                                        className="py-3 px-6 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Afficher la dictée
                                    </button>
                                )}
                            </div>

                            {showContent && (
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-fade-in">
                                    <div
                                        className="
                                            text-3xl sm:text-4xl md:text-5xl lg:text-6xl
                                            font-noto
                                            text-gray-900
                                            leading-loose
                                            text-right
                                            tracking-wide
                                            break-words
                                            rtl
                                            mb-6
                                        "
                                        dir="rtl"
                                    >
                                        {dictation.content}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!dictation && !loading && !error && (
                        <p className="text-center text-gray-600">Aucune dictée disponible</p>
                    )}
                </div>
            )}
        </div>
    );
}