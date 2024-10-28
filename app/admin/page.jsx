'use client'

import React, {useState} from 'react';
import {ref, uploadBytes, getDownloadURL} from 'firebase/storage';
import {collection, addDoc} from 'firebase/firestore';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {storage, db} from "@/app/firebase";
import {Controller, useForm} from "react-hook-form";

const arabicLetters = ['ب', 'ت', 'د', 'ر', 'ك', 'س', 'ل', 'ج', 'م', 'ح', 'خ', 'ا', 'و', 'ي', 'ن', 'ه', 'ث', 'ق', 'ش', 'ف', 'ز', 'ط', 'ع', 'غ', 'ذ', 'ص', 'ض', 'ظ'];

const baseSchema = {
    audioFile: z
        .instanceof(File, { message: "Veuillez sélectionner un fichier valide."})
        .refine((file) => file.size <= 10000000, 'La taille du fichier doit être inférieur à 10MB')
        .refine(
            (file) => ['audio/mp3', 'audio/ogg', 'audio/mpeg', 'audio/wav'].includes(file.type),
            'Seuls les fichiers .mp3, .ogg .mpeg et .wav sont autorisés.'
        ),
    type: z.enum(['Lettre', 'Texte'], {
        required_error: 'Veuillez sélectionner un type',
    }),
    content: z
        .string({
            required_error: 'Veuillez entrer un contenu.',
        })
        .min(1, 'Veuillez entrer un contenu.'),
};

const formSchema = z.discriminatedUnion('type', [
    z.object({
        ...baseSchema,
        type: z.literal('Lettre'),
        selectedLetter: z.string({
            required_error: 'Veuillez sélectionner une lettre.',
        }).refine(
            (val) => arabicLetters.includes(val),
            'Veuillez sélectionner une lettre.'
        ),
        difficulty: z.string().optional(),
    }),
    z.object({
        ...baseSchema,
        type: z.literal('Texte'),
        difficulty: z.enum(['Facile', 'Moyen', 'Difficile'], {
            errorMap: (issue, ctx) => {
                return { message: 'Veuillez sélectionner un niveau de difficulté.' };
            }
        }),
        selectedLetter: z.string().optional(),
    })
]);

const DictationForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fileName, setFileName] = useState('');

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: {errors},
    } = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            audioFile: undefined,
            type: undefined,
            selectedLetter: '',
            difficulty: '',
            content: '',
        },
    });

    const selectedType = watch('type');

    const onSubmit = async (data) => {
        setIsSubmitting(true);

        try {
            const audioRef = ref(storage, `dictations/${Date.now()}_${data.audioFile.name}`);
            const uploadResult = await uploadBytes(audioRef, data.audioFile);
            const audioUrl = await getDownloadURL(uploadResult.ref);

            const dictationData = {
                audioUrl,
                type: data.type,
                content: data.content,
                ...(data.type === 'Lettre' && {
                    letter: data.selectedLetter,
                    letterIndex: arabicLetters.indexOf(data.selectedLetter),
                }),
                ...(data.type === 'Texte' && {difficulty: data.difficulty}),
                createdAt: new Date(),
            };

            await addDoc(collection(db, 'dictations'), dictationData);

            reset();
            setFileName('');

            alert('Dictation added successfully!');
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error adding dictation. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Add New Dictation</h2>
                        <p className="mt-2 text-sm text-gray-600">Upload audio files and manage dictation content</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Fichier audio
                            </label>
                            <Controller
                                name="audioFile"
                                control={control}
                                render={({field: {onChange, value}}) => (
                                    <div className="flex flex-col">
                                        <div className="flex items-center justify-center w-full">
                                            <label
                                                className={`w-full flex flex-col items-center px-4 py-6 bg-white text-gray-700 rounded-lg border-2 border-dashed ${
                                                    errors.audioFile ? 'border-red-500' : 'border-gray-300'
                                                } cursor-pointer hover:bg-gray-50 transition-colors`}>
                                                <span className="mt-2 text-sm text-gray-500">
                                                    {fileName || 'Sélectionner un fichier audio (MP3, OGG, MPEG et WAV)'}
                                                </span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept=".mp3,.ogg,.mpeg,.wav,audio/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            onChange(file);
                                                            setFileName(file.name);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                        {errors.audioFile && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.audioFile.message}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Type
                            </label>
                            <Controller
                                name="type"
                                control={control}
                                render={({field}) => (
                                    <select
                                        {...field}
                                        defaultValue=""
                                        className={`mt-1 block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                                            errors.type ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="" disabled>Sélectionner un type</option>
                                        <option value="Lettre">Lettre</option>
                                        <option value="Texte">Texte</option>
                                    </select>
                                )}
                            />
                            {errors.type && (
                                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                            )}
                        </div>

                        {selectedType === 'Lettre' && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Sélectionner une lettre
                                </label>
                                <div className="grid grid-cols-7 gap-2 text-xl font-bold" dir="rtl">
                                    {arabicLetters.map((letter) => (
                                        <button
                                            key={letter}
                                            type="button"
                                            onClick={() => setValue('selectedLetter', letter)}
                                            className={`p-2 text-center rounded-md transition-colors ${
                                                watch('selectedLetter') === letter
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                            }`}
                                        >
                                            {letter}
                                        </button>
                                    ))}
                                </div>
                                {errors.selectedLetter && (
                                    <p className="mt-1 text-sm text-red-600">{errors.selectedLetter.message}</p>
                                )}
                            </div>
                        )}

                        {selectedType === 'Texte' && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Difficulté
                                </label>
                                <div className="grid grid-cols-3 gap-4">
                                    {['Facile', 'Moyen', 'Difficile'].map((level) => (
                                        <button
                                            key={level}
                                            type="button"
                                            onClick={() => setValue('difficulty', level)}
                                            className={`py-2 px-4 rounded-md transition-colors ${
                                                watch('difficulty') === level
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                                {errors.difficulty && (
                                    <p className="mt-1 text-sm text-red-600">{errors.difficulty.message}</p>
                                )}
                            </div>
                        )}

                        {selectedType && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Dictée
                                </label>
                                <Controller
                                    name="content"
                                    control={control}
                                    render={({field}) => (
                                        <textarea
                                            {...field}
                                            rows={4}
                                            lang="ar"
                                            spellCheck="false"
                                            dir="rtl"
                                            className={`mt-1 block w-full py-2 px-3 border rounded-md text-xl shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                                                errors.content ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="الإملاء..."
                                        />
                                    )}
                                />
                                {errors.content && (
                                    <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex justify-center py-3 px-4 uppercase border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                         xmlns="http://www.w3.org/2000/svg"
                                         fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor"
                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Chargement...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    Ajouter
                                </span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DictationForm;