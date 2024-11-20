'use client'

import React, {useState, useCallback, useEffect} from 'react';
import {ref, uploadBytes, getDownloadURL} from 'firebase/storage';
import {collection, addDoc, doc, updateDoc} from 'firebase/firestore';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {storage, db, auth} from "@/app/firebase";
import {Controller, useForm} from "react-hook-form";
import AudioRecorder from "@/app/components/AudioRecorder";
import {useFlash} from "@/app/contexts/FlashContext";
import AudioPlayer from "@/app/components/AudioPlayer";

const arabicLetters = ['ب', 'ت', 'د', 'ر', 'ك', 'س', 'ل', 'ج', 'م', 'ح', 'خ', 'ا', 'و', 'ي', 'ن', 'ه', 'ث', 'ق', 'ش', 'ف', 'ز', 'ط', 'ع', 'غ', 'ذ', 'ص', 'ض', 'ظ'];

const getAudioFileSchema = (hasExistingAudio) => {
    if (hasExistingAudio) {
        return z.instanceof(File).optional();
    }
    return z
        .instanceof(File, { message: "Veuillez sélectionner un fichier valide." })
        .refine((file) => file.size <= 10000000, 'La taille du fichier doit être inférieur à 10MB')
        .refine(
            (file) => ['audio/mp3', 'audio/ogg', 'audio/mpeg', 'audio/wav'].includes(file.type),
            'Seuls les fichiers .mp3, .ogg .mpeg et .wav sont autorisés.'
        );
};

const getFormSchema = (hasExistingAudio) => {
    const baseSchema = {
        audioFile: getAudioFileSchema(hasExistingAudio),
        type: z.enum(['Lettre', 'Texte'], {
            required_error: 'Veuillez sélectionner un type',
        }),
        content: z
            .string({
                required_error: 'Veuillez entrer un contenu.',
            })
            .min(1, 'Veuillez entrer un contenu.'),
    };

    return z.discriminatedUnion('type', [
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
                errorMap: () => ({ message: 'Veuillez sélectionner un niveau de difficulté.' })
            }),
            selectedLetter: z.string().optional(),
        })
    ]);
};

const DictationForm = ({onSuccess,initialData = null }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fileName, setFileName] = useState('');
    const [resetKey, setResetKey] = useState(0);
    const [isEditingAudio, setIsEditingAudio] = useState(false);
    const { showFlash } = useFlash();

    const handleEditAudio = () => {
        setIsEditingAudio(true);
    };

    const handleCancelEditAudio = () => {
        setIsEditingAudio(false);
        setValue('audioFile', undefined);
    };

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        reset: formReset,
        formState: {errors},
    } = useForm({
        resolver: zodResolver(getFormSchema(!!initialData?.audioUrl && !isEditingAudio)),
        defaultValues: {
            audioFile: undefined,
            type: initialData?.type || "",
            selectedLetter: initialData?.letter || '',
            indexSelectedLetter: initialData?.letterIndex || null,
            difficulty: initialData?.difficulty || '',
            content: initialData?.content || '',
        },
    });

    useEffect(() => {
        const schema = getFormSchema(!!initialData?.audioUrl && !isEditingAudio);
        zodResolver(schema);
    }, [isEditingAudio, initialData?.audioUrl]);

    useEffect(() => {
        if (initialData) {
            setValue('type', initialData.type);
            setValue('content', initialData.content);
            if (initialData.type === 'Lettre') {
                setValue('selectedLetter', initialData.letter);
                setValue('selectedIndexLetter', initialData.letterIndex);
            } else {
                setValue('difficulty', initialData.difficulty);
            }
        }
    }, [initialData, setValue]);

    const selectedType = watch('type');

    const resetForm = useCallback(() => {
        formReset();
        setFileName('');
        setResetKey(prev => prev + 1);
    }, [formReset]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);

        try {

            if (!auth.currentUser) {
                throw new Error('User not authenticated');
            }
            let audioUrl = initialData?.audioUrl;

            if (data.audioFile) {
                const audioRef = ref(storage, `dictations/${Date.now()}_${data.audioFile.name}`);
                const uploadResult = await uploadBytes(audioRef, data.audioFile);
                audioUrl = await getDownloadURL(uploadResult.ref);
            }

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

            if (initialData) {
                await updateDoc(doc(db, 'dictations', initialData.id), dictationData);
                showFlash('Dictée modifiée avec succès !');
            } else {
                dictationData.createdAt = new Date();
                await addDoc(collection(db, 'dictations'), dictationData);
                showFlash('Dictée ajoutée avec succès !');
            }

            onSuccess()
        } catch (error) {
            console.error('Error submitting form:', error);
            showFlash('Erreur lors de l\'ajout de la dictée. Veuillez réessayer.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="">
            <div className="p-2 space-y-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Fichier audio
                            </label>
                            {initialData?.audioUrl && !isEditingAudio ? (
                                <div className="space-y-4">
                                    <AudioPlayer audio={initialData.audioUrl}/>
                                    <button
                                        type="button"
                                        onClick={handleEditAudio}
                                        className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    >
                                        Modifier audio
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Controller
                                        name="audioFile"
                                        control={control}
                                        render={({field: {onChange}}) => (
                                            <div className="flex flex-col">
                                                <AudioRecorder
                                                    key={resetKey}
                                                    onAudioChange={(file) => {
                                                        onChange(file);
                                                    }}
                                                />
                                                {errors.audioFile && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors.audioFile.message}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    />
                                    {initialData?.audioUrl && (
                                        <button
                                            type="button"
                                            onClick={handleCancelEditAudio}
                                            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                        >
                                            Annuler la modification
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
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
                                    disabled={!!initialData}
                                    className={`mt-1 block w-full py-2 px-3 text-black border rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black ${
                                        errors.type ? 'border-red-500' : 'border-gray-300'
                                    } ${initialData ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                            <div className="grid lg:grid-cols-7 grid-cols-4 gap-2 text-xl font-semibold font-noto" dir="rtl">
                                {arabicLetters.map((letter, key) => (
                                    <button
                                        key={letter}
                                        type="button"
                                        onClick={() => {
                                            setValue('selectedLetter', letter);
                                            setValue('selectedIndexLetter', key)
                                        }}
                                        className={`p-2 text-center rounded-md ${
                                            watch('selectedIndexLetter') >= key
                                                ? 'bg-gray-900 font-bold text-white'
                                                : 'bg-gray-50 hover:bg-gray-100 border text-black'
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
                                                ? 'bg-gray-900 text-white'
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
                                    className={`mt-1 block w-full py-2 px-3 text-black border rounded-md text-xl shadow-sm focus:outline-none focus:ring-black focus:border-black ${
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

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-3 px-4 uppercase border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-400"
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
                                {initialData ? 'Mise à jour...' : 'Chargement...'}
                            </span>
                        ) : (
                            <span className="flex items-center">
                                {initialData ? 'Mettre à jour' : 'Ajouter'}
                            </span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DictationForm;