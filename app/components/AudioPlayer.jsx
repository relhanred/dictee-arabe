import React, {useState, useRef, useEffect, forwardRef, useImperativeHandle} from 'react';
import WaveSurfer from 'wavesurfer.js';
import {PlayIcon} from '@/app/components/icons/PlayIcon';
import {PauseIcon} from '@/app/components/icons/PauseIcon';

const AudioPlayer = forwardRef(({audio, options = false, autoPlay = false}, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLooping, setIsLooping] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);
    const loopingRef = useRef(false);
    const abortControllerRef = useRef(null);

    // Fonction de nettoyage sécurisée pour WaveSurfer
    const safelyDestroyWaveSurfer = () => {
        try {
            if (wavesurferRef.current) {
                // Détacher tous les événements avant de détruire
                wavesurferRef.current.unAll();
                wavesurferRef.current.pause();
                wavesurferRef.current.destroy();
            }
        } catch (error) {
            console.error("Erreur lors de la destruction de WaveSurfer:", error);
        } finally {
            wavesurferRef.current = null;
        }
    };

    // Exposer des méthodes au composant parent via la ref
    useImperativeHandle(ref, () => ({
        stopAudio: () => {
            if (wavesurferRef.current) {
                try {
                    wavesurferRef.current.pause();
                    wavesurferRef.current.seekTo(0);
                } catch (error) {
                    console.error("Erreur lors de l'arrêt de l'audio:", error);
                }
                setIsPlaying(false);
                setCurrentTime(0);
            }
        },
        destroyAudio: safelyDestroyWaveSurfer
    }));

    // Mettre à jour la ref quand l'état change
    useEffect(() => {
        loopingRef.current = isLooping;
    }, [isLooping]);

    // Initialisation ou réinitialisation de WaveSurfer
    useEffect(() => {
        // Nettoyer l'instance précédente et l'AbortController
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        safelyDestroyWaveSurfer();

        // Créer un nouvel AbortController pour cette instance
        abortControllerRef.current = new AbortController();

        if (!waveformRef.current) return;

        // Créer une nouvelle instance de WaveSurfer
        const wavesurfer = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#ced1d0',
            progressColor: '#858b8c',
            height: 40,
            barWidth: 3,
            barGap: 2.25,
            barRadius: 3,
            normalize: true,
            cursorWidth: 0
        });

        wavesurferRef.current = wavesurfer;

        // Configuration des événements
        const onReady = () => {
            try {
                if (wavesurferRef.current) {
                    setDuration(wavesurferRef.current.getDuration());
                    wavesurferRef.current.setPlaybackRate(playbackRate);

                    if (autoPlay) {
                        wavesurferRef.current.play();
                    }
                }
            } catch (error) {
                console.error("Erreur lors de l'événement ready:", error);
            }
        };

        const onAudioprocess = () => {
            try {
                if (wavesurferRef.current) {
                    setCurrentTime(wavesurferRef.current.getCurrentTime());
                }
            } catch (error) {
                console.error("Erreur lors de l'événement audioprocess:", error);
            }
        };

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);

        const onFinish = () => {
            try {
                if (!wavesurferRef.current) return;

                if (loopingRef.current) {
                    wavesurferRef.current.seekTo(0);
                    wavesurferRef.current.play();
                } else {
                    setIsPlaying(false);
                    setCurrentTime(0);
                    wavesurferRef.current.seekTo(0);
                }
            } catch (error) {
                console.error("Erreur lors de l'événement finish:", error);
            }
        };

        // Ajouter les écouteurs d'événements
        wavesurfer.on('ready', onReady);
        wavesurfer.on('audioprocess', onAudioprocess);
        wavesurfer.on('play', onPlay);
        wavesurfer.on('pause', onPause);
        wavesurfer.on('finish', onFinish);

        // Chargement de l'audio
        try {
            wavesurfer.load(audio);
        } catch (error) {
            console.error("Erreur lors du chargement de l'audio:", error);
        }

        // Nettoyage
        return () => {
            try {
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }

                // Détacher les écouteurs d'événements explicitement
                if (wavesurferRef.current) {
                    wavesurferRef.current.un('ready', onReady);
                    wavesurferRef.current.un('audioprocess', onAudioprocess);
                    wavesurferRef.current.un('play', onPlay);
                    wavesurferRef.current.un('pause', onPause);
                    wavesurferRef.current.un('finish', onFinish);
                }

                safelyDestroyWaveSurfer();
            } catch (error) {
                console.error("Erreur lors du nettoyage de WaveSurfer:", error);
            }
        };
    }, [audio, autoPlay, playbackRate]);

    const handlePlayPause = () => {
        try {
            if (!wavesurferRef.current) return;

            if (isPlaying) {
                wavesurferRef.current.pause();
            } else {
                wavesurferRef.current.play();
            }
        } catch (error) {
            console.error("Erreur lors du play/pause:", error);
        }
    };

    const toggleLoop = () => {
        setIsLooping(prev => !prev);
    };

    const handlePlaybackRateChange = (newRate) => {
        setPlaybackRate(newRate);
        try {
            if (wavesurferRef.current) {
                wavesurferRef.current.setPlaybackRate(newRate);
            }
        } catch (error) {
            console.error("Erreur lors du changement de vitesse:", error);
        }
    };

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <div className="relative w-full">
                <div className="w-full bg-white pl-8 pr-3 pt-3 pb-6 rounded-xl border">
                    <div ref={waveformRef} className="w-full"></div>
                </div>

                <button
                    type="button"
                    onClick={handlePlayPause}
                    className="inline-flex w-fit h-fit hover:text-indigo-700 text-indigo-600 top-4 left-0 absolute"
                >
                    {isPlaying ? (
                        <PauseIcon className="size-8 text-[#9a8f8d]"/>
                    ) : (
                        <PlayIcon className="size-8 text-[#9a8f8d]"/>
                    )}
                </button>
                <span className="absolute text-[#858b8c] text-sm bottom-1 left-7">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </span>
            </div>

            {options && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full mt-3 px-2 space-y-3 sm:space-y-0">
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={toggleLoop}
                            className={`px-3 py-1.5 text-sm rounded-md transition ${
                                isLooping
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <div className="flex items-center space-x-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 2l4 4-4 4"></path>
                                    <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
                                    <path d="M7 22l-4-4 4-4"></path>
                                    <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
                                </svg>
                                <span>Répéter</span>
                            </div>
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex flex-wrap gap-2">
                            {[0.5, 0.75, 1, 1.25, 1.5].map(rate => (
                                <button
                                    key={rate}
                                    onClick={() => handlePlaybackRateChange(rate)}
                                    className={`w-9 h-8 text-xs font-medium rounded transition ${
                                        playbackRate === rate
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {rate === 1 ? 'x1' : rate > 1 ? `x${rate}` : `x${rate}`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;