import React, {useState, useRef, useEffect, useCallback} from 'react';
import WaveSurfer from 'wavesurfer.js';
import {PlayIcon} from '@/app/components/icons/PlayIcon';
import {PauseIcon} from '@/app/components/icons/PauseIcon';

const AudioPlayer = ({audio, options = false}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLooping, setIsLooping] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);
    const recorderRef = useRef(null);
    const loopingRef = useRef(false); // Ref pour accéder à la valeur actuelle dans les callbacks

    // Mettre à jour la ref quand l'état change
    useEffect(() => {
        loopingRef.current = isLooping;
    }, [isLooping]);

    // Initialisation de WaveSurfer
    useEffect(() => {
        if (!waveformRef.current || wavesurferRef.current) return;

        const wavesurfer = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#ced1d0',
            progressColor: '#858b8c',
            height: 40,
            barWidth: 3,
            barGap: 2.25,
            barRadius: 3,
            normalize: true,
            cursorWidth: 0,
            url: audio
        });

        wavesurferRef.current = wavesurfer;

        // Configuration des événements de base
        wavesurfer.on('ready', () => {
            setDuration(wavesurfer.getDuration());
        });

        wavesurfer.on('audioprocess', () => {
            setCurrentTime(wavesurfer.getCurrentTime());
        });

        wavesurfer.on('play', () => {
            setIsPlaying(true);
        });

        wavesurfer.on('pause', () => {
            setIsPlaying(false);
        });

        // Gestionnaire pour la fin de la lecture
        wavesurfer.on('finish', handleFinish);

        return () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }
        };
    }, [audio]);

    // Gestionnaire de fin explicitement défini comme fonction pour pouvoir y accéder via la ref
    const handleFinish = useCallback(() => {
        if (loopingRef.current && wavesurferRef.current) {
            wavesurferRef.current.seekTo(0);
            wavesurferRef.current.play();
        } else if (wavesurferRef.current) {
            setIsPlaying(false);
            setCurrentTime(0);
            wavesurferRef.current.seekTo(0);
        }
    }, []);

    // Mise à jour de la vitesse de lecture
    useEffect(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.setPlaybackRate(playbackRate);
        }
    }, [playbackRate]);

    const handlePlayPause = () => {
        if (!wavesurferRef.current) return;

        if (isPlaying) {
            wavesurferRef.current.pause();
        } else {
            wavesurferRef.current.play();
        }
    };

    const toggleLoop = () => {
        setIsLooping(prev => !prev);
    };

    const handlePlaybackRateChange = (newRate) => {
        setPlaybackRate(newRate);
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

            {/* Options de contrôle - Affichées uniquement si options=true */}
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
};

export default AudioPlayer;