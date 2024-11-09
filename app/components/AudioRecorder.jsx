import React, {useState, useRef, useEffect} from 'react';
import WaveSurfer from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record';
import {PlayIcon} from "@/app/components/icons/PlayIcon";
import {PauseIcon} from "@/app/components/icons/PauseIcon";

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
        if (!wavesurferRef.current) {
            wavesurferRef.current = WaveSurfer.create({
                container: waveformRef.current,
                waveColor: '#c3caef',
                progressColor: '#2b6cb0',
                height: 64,
                barWidth: 2,
                barGap: 3,
                barRadius: 2,
                cursorWidth: 1,
                scrollParent: true,
                minPxPerSec: 1,
                autoCenter: true,
            });

            recorderRef.current = wavesurferRef.current.registerPlugin(RecordPlugin.create({
                scrollingWaveform: true,
                renderRecordedAudio: false,
            }));

            recorderRef.current.on('record-start', () => {
                resetTimers(); // Reset timers before starting new recording
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

            recorderRef.current.on('record-progress', (time) => {
            });
        }

        return () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
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
        console.log("delete audio")
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

    useEffect(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.on('play', () => setIsPlaying(true));
            wavesurferRef.current.on('pause', () => setIsPlaying(false));
            wavesurferRef.current.on('finish', () => setIsPlaying(false));
            wavesurferRef.current.on('audioprocess', () => {
                setPlaybackTime(Math.floor(wavesurferRef.current.getCurrentTime()));
            });
        }
    }, []);

    return (
        <div className="relative flex flex-col items-center justify-center w-full bg-white">
            <div className="flex items-center space-x-4 mb-4">
                <button
                    type="button"
                    className={`rounded-full w-16 h-16 flex items-center justify-center ${
                        isRecording ? 'bg-red-600 hover:bg-red-500' : 'bg-black hover:bg-gray-800'
                    }`}
                    onClick={toggleRecording}
                >
                    {!isRecording ? (
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                        </svg>
                    ) : (
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
                        </svg>
                    )}
                </button>
                {isRecording && (
                    <div className="text-lg font-semibold">
                        {formatTime(recordingTime)}
                    </div>
                )}
            </div>

            <div className="relative w-full">


                <div className={isRecording || audioFile ? "w-full bg-gray-50 px-8 py-1.5 rounded-md" : "hidden"}>
                    <div ref={waveformRef} className="w-full h-full"></div>
                </div>

                {audioFile && !isRecording && (
                    <>
                        <button
                            type="button"
                            onClick={playPause}
                            className="inline-flex w-fit h-fit hover:text-indigo-700 text-indigo-600 -left-1.5 top-5 absolute"
                        >
                            {isPlaying ? (
                                <PauseIcon className="size-10"/>
                            ) : (
                                <PlayIcon className="size-10"/>
                            )}
                        </button>
                        <span className="text-black font-bold text-2xl">
                        {formatTime(playbackTime)}
                        </span>
                        <button
                            type="button"
                            onClick={deleteAudio}
                            className="text-red-600 hover:text-red-400 -right-1.5 top-5 absolute"
                        >
                            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </>
                )}

            </div>

            {!audioFile && !isRecording && (
                <>
                    <div className="font-black uppercase text-xl text-indigo-950">ou</div>
                    <div className="flex items-center justify-center w-full">
                        <label
                            className={`w-full flex flex-col items-center px-4 py-6 bg-white text-gray-700 rounded-lg border-2 border-dashed ${
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