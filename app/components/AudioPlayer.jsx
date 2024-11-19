import React, {useState, useRef, useEffect} from 'react';
import WaveSurfer from 'wavesurfer.js';
import {PlayIcon} from '@/app/components/icons/PlayIcon';
import {PauseIcon} from '@/app/components/icons/PauseIcon';

const AudioPlayer = ({audio}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);

    useEffect(() => {
        if (waveformRef.current && !wavesurferRef.current) {
            wavesurferRef.current = WaveSurfer.create({
                container: waveformRef.current,
                waveColor: '#ced1d0',
                progressColor: '#858b8c',
                height: 24,
                barWidth: 2,
                barGap: 3,
                barRadius: 2,
                url: audio
            });

            wavesurferRef.current.on('ready', () => {
                setDuration(wavesurferRef.current.getDuration());
            });

            wavesurferRef.current.on('audioprocess', () => {
                setCurrentTime(wavesurferRef.current.getCurrentTime());
            });

            wavesurferRef.current.on('play', () => {
                setIsPlaying(true);
            });

            wavesurferRef.current.on('pause', () => {
                setIsPlaying(false);
            });

            wavesurferRef.current.on('finish', () => {
                setIsPlaying(false);
                setCurrentTime(0);
                wavesurferRef.current.seekTo(0);
            });
        }
    }, [audio]);

    const handlePlayPause = () => {
        if (isPlaying) {
            wavesurferRef.current.pause();
        } else {
            wavesurferRef.current.play();
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
                <div className="w-full bg-white pl-8 pr-4 py-6 rounded-xl border">
                    <div ref={waveformRef} className="w-full"></div>
                </div>

                <button
                    type="button"
                    onClick={handlePlayPause}
                    className="inline-flex w-fit h-fit hover:text-indigo-700 text-indigo-600 top-5 absolute"
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
        </div>
    );
};

export default AudioPlayer;