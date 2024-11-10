import React, {useState, useRef, useEffect} from 'react';
import WaveSurfer from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record';
import HoverPlugin from "wavesurfer.js/plugins/hover";
import {PlayIcon} from "@/app/components/icons/PlayIcon";
import {PauseIcon} from "@/app/components/icons/PauseIcon";
import {MicrophoneIcon} from "@/app/components/icons/MicrophoneIcon";
import {StopIcon} from "@/app/components/icons/StopIcon";
import {CloseIcon} from "@/app/components/icons/CloseIcon";

const AudioRecorder = ({onAudioChange, reset: shouldReset}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [playbackTime, setPlaybackTime] = useState(0);
    const [audioFile, setAudioFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [errors, setErrors] = useState({});

    const fileInputRef = useRef(null);
    const recordingTimerRef = useRef(null);
    const recordingStartTimeRef = useRef(0);
    const currentRecordingTimeRef = useRef(0);
    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);
    const recorderRef = useRef(null);

    const resetTimers = () => {
        setRecordingTime(0);
        setPlaybackTime(0);
        currentRecordingTimeRef.current = 0;
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
    };

    useEffect(() => {
        if (!wavesurferRef.current &&  waveformRef.current) {
            wavesurferRef.current = WaveSurfer.create({
                container: waveformRef.current,
                waveColor: '#ced1d0',
                progressColor: '#858b8c',
                height: 56,
                barWidth: 2,
                barGap: 3,
                barRadius: 2,
                scrollParent: true,
                minPxPerSec: 1,
                autoCenter: true,
                plugins: [
                    RecordPlugin.create({
                        scrollingWaveform: true,
                    }),
                    HoverPlugin.create({
                        lineColor: '#808080',
                        lineWidth: 1,
                        labelBackground: '#ffffff',
                        labelColor: '#000000',
                        labelSize: '12px',
                    }),
                ]
            });

            recorderRef.current = wavesurferRef.current.plugins[0];

            recorderRef.current.on('record-start', () => {
                resetTimers();
                setIsRecording(true);
                recordingStartTimeRef.current = Date.now();
                currentRecordingTimeRef.current = 0;
                recordingTimerRef.current = setInterval(() => {
                    const newTime = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
                    currentRecordingTimeRef.current = newTime;
                    setRecordingTime(newTime);
                }, 1000);
            });

            recorderRef.current.on('record-end', (blob) => {
                const file = new File([blob], 'recorded_audio.wav', {type: 'audio/wav'});
                setAudioFile(file);
                setFileName('recorded_audio.wav');
                onAudioChange(file);
                clearInterval(recordingTimerRef.current);
                setIsRecording(false);

                const finalTime = currentRecordingTimeRef.current;
                setPlaybackTime(finalTime);
                setRecordingTime(finalTime);

                wavesurferRef.current.loadBlob(blob);
            });
        }

        wavesurferRef.current.on('play', () => setIsPlaying(true));
        wavesurferRef.current.on('pause', () => setIsPlaying(false));
        wavesurferRef.current.on('finish', () => setIsPlaying(false));
        wavesurferRef.current.on('audioprocess', () => {
            setPlaybackTime(Math.floor(wavesurferRef.current.getCurrentTime()));
        });

        return () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (shouldReset) {
            deleteAudio();
        }
    }, []);

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && (file.type === 'audio/mp3' || file.type === 'audio/wav' || file.type === 'audio/mpeg' || file.type === 'audio/ogg')) {
            resetTimers();
            setAudioFile(file);
            setFileName(file.name);
            setErrors({});
            onAudioChange(file);
            wavesurferRef.current.loadBlob(file);
            const audioElement = new Audio(URL.createObjectURL(file));
            audioElement.onloadedmetadata = () => {
                const duration = Math.floor(audioElement.duration);
                setRecordingTime(duration);
                setPlaybackTime(duration);
            };
        } else {
            setErrors({audioFile: true});
            alert('Please select a valid audio file (MP3, OGG, MPEG, or WAV).');
        }
    };

    const toggleRecording = async () => {
        setIsPlaying(false);
        if (!isRecording) {
            try {
                wavesurferRef.current.empty();
                await recorderRef.current.startRecording();
            } catch (error) {
                console.error('Error accessing microphone:', error);
                if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
                    alert('Unable to access the microphone. Please check your browser permissions and make sure a microphone is connected.');
                }
            }
        } else {
            await recorderRef.current.stopRecording();
            clearInterval(recordingTimerRef.current);
        }
    };

    const deleteAudio = () => {
        setAudioFile(null);
        setFileName('');
        onAudioChange(null);
        setIsPlaying(false);
        resetTimers();
        setErrors({});
        wavesurferRef.current.empty();
        if (recorderRef.current) {
            recorderRef.current.stopRecording();
        }
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
    };

    const playPause = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-center w-full">
            {
                (!isRecording && !audioFile) && (
                    <div className="flex items-center space-x-4">
                        <button
                            type="button"
                            className={`rounded-full w-16 h-16 flex items-center justify-center ${
                                isRecording ? 'bg-red-600 hover:bg-red-500' : 'bg-black hover:bg-gray-800'
                            }`}
                            onClick={toggleRecording}
                        >
                            <MicrophoneIcon className="size-8 text-white"/>
                        </button>

                    </div>
                )
            }



            <div className="relative w-full">

                <div
                    className={isRecording || audioFile ? "w-full bg-white pl-16 pr-10 py-6 rounded-xl border" : "hidden"}>
                    <div ref={waveformRef} className="w-full"></div>
                </div>

                {isRecording && (
                    <button
                        type="button"
                        onClick={toggleRecording}
                        className="inline-flex w-fit h-fit text-red-600 top-7 absolute"
                    >
                       <StopIcon className="size-12"/>
                    </button>
                )}

                {isRecording && (
                    <span className="absolute text-[#858b8c] text-sm bottom-1 left-[68px]">
                        {formatTime(recordingTime)}
                    </span>
                )}

                {audioFile && !isRecording && (
                    <>
                        <button
                            type="button"
                            onClick={playPause}
                            className="inline-flex w-fit h-fit hover:text-indigo-700 text-indigo-600 top-7 absolute"
                        >
                            {isPlaying ? (
                                <PauseIcon className="size-12 text-[#9a8f8d]"/>
                            ) : (
                                <PlayIcon className="size-12 text-[#9a8f8d]"/>
                            )}
                        </button>
                        <span className="absolute text-[#858b8c] text-sm bottom-1 left-[68px]">
                        {formatTime(playbackTime)}
                        </span>
                        <button
                            type="button"
                            onClick={deleteAudio}
                            className="text-[#9a8f8d] right-1 top-1 absolute"
                        >
                           <CloseIcon className="size-6 "/>
                        </button>
                    </>
                )}

            </div>

            {!audioFile && !isRecording && (
                <>
                    <div className="font-black uppercase text-xl text-indigo-950 my-4">ou</div>
                    <div className="flex items-center justify-center w-full">
                        <label
                            className={`w-full inline-flex flex-col items-center justify-center px-4 py-6 bg-white text-gray-700 min-h-[114px] rounded-lg border-2 border-dashed ${
                                errors.audioFile ? 'border-red-500' : 'border-gray-300'
                            } cursor-pointer hover:bg-gray-50 transition-colors`}
                        >
                            <span className="mt-2 text-sm text-gray-500">
                                {fileName || 'Sélectionner un fichier audio (MP3, OGG, MPEG ou WAV)'}
                            </span>
                            <input
                                type="file"
                                className="hidden"
                                accept=".mp3,.ogg,.mpeg,.wav,audio/*"
                                onChange={handleFileUpload}
                            />
                        </label>
                    </div>
                </>
            )}
        </div>
    );
};

export default AudioRecorder;