'use client';

import { useEffect, useState, useRef } from 'react';

interface VoiceModeSimpleProps {
    isActive: boolean;
    onClose: () => void;
    isSpeaking: boolean;
}

export default function VoiceModeSimple({
    isActive,
    onClose,
    isSpeaking,
}: VoiceModeSimpleProps) {
    const [micVolume, setMicVolume] = useState(0);
    const [waveformData, setWaveformData] = useState<number[]>(new Array(20).fill(0.2));

    const micAudioContextRef = useRef<AudioContext | null>(null);
    const micAnalyserRef = useRef<AnalyserNode | null>(null);
    const micAnimationFrameRef = useRef<number | null>(null);
    const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Always listen to microphone when active
    useEffect(() => {
        if (!isActive) return;

        const setupMicAnalysis = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                const microphone = audioContext.createMediaStreamSource(stream);

                analyser.smoothingTimeConstant = 0.8;
                analyser.fftSize = 256;

                microphone.connect(analyser);

                micAudioContextRef.current = audioContext;
                micAnalyserRef.current = analyser;

                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                const updateVolume = () => {
                    if (micAnalyserRef.current) {
                        micAnalyserRef.current.getByteFrequencyData(dataArray);
                        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                        setMicVolume(Math.min(average / 128, 1));
                        micAnimationFrameRef.current = requestAnimationFrame(updateVolume);
                    }
                };

                updateVolume();
            } catch (error) {
                console.error('Error accessing microphone:', error);
            }
        };

        setupMicAnalysis();

        return () => {
            if (micAudioContextRef.current) {
                micAudioContextRef.current.close();
            }
            if (micAnimationFrameRef.current) {
                cancelAnimationFrame(micAnimationFrameRef.current);
            }
        };
    }, [isActive]);

    // Animate waveform when AI is speaking
    useEffect(() => {
        if (isSpeaking) {
            console.log('Starting waveform animation');
            waveformIntervalRef.current = setInterval(() => {
                // Generate completely new random array each time
                const newData = Array.from({ length: 20 }, () => 0.3 + Math.random() * 0.7);
                setWaveformData(newData);
            }, 80);
        } else {
            console.log('Stopping waveform animation');
            // Reset to idle state
            setWaveformData(new Array(20).fill(0.2));
            if (waveformIntervalRef.current) {
                clearInterval(waveformIntervalRef.current);
            }
        }

        return () => {
            if (waveformIntervalRef.current) {
                clearInterval(waveformIntervalRef.current);
            }
        };
    }, [isSpeaking]);

    // Close on ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isActive) {
                onClose();
            }
        };

        if (isActive) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isActive, onClose]);

    if (!isActive) return null;

    const scale = 1 + micVolume * 0.3;
    const glowIntensity = micVolume * 60;

    return (
        <div
            className="fixed inset-0 bg-black z-50 flex items-center justify-center cursor-pointer"
            onClick={onClose}
        >
            {/* Container with fixed height for positioning */}
            <div className="relative flex items-center justify-center" style={{ height: '400px', width: '100%' }}>

                {/* Waveform - AI Speaking - Positioned above center */}
                {isSpeaking && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-1.5 h-24">
                        {waveformData.map((height, i) => (
                            <div
                                key={i}
                                className="w-2 bg-blue-400 rounded-full transition-all duration-100 ease-out"
                                style={{
                                    height: `${height * 80}px`,
                                    opacity: 0.5 + height * 0.5,
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Microphone - Always Listening - Fixed in center */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="relative flex items-center justify-center">
                        {/* Glow rings when user speaks */}
                        {micVolume > 0.15 && (
                            <>
                                <div
                                    className="absolute rounded-full bg-green-400/20 animate-ping"
                                    style={{
                                        width: `${140 + glowIntensity}px`,
                                        height: `${140 + glowIntensity}px`,
                                        opacity: micVolume * 0.5,
                                    }}
                                />
                                <div
                                    className="absolute rounded-full bg-green-400/10 animate-pulse"
                                    style={{
                                        width: `${160 + glowIntensity * 1.5}px`,
                                        height: `${160 + glowIntensity * 1.5}px`,
                                        opacity: micVolume * 0.3,
                                    }}
                                />
                            </>
                        )}

                        {/* Microphone Icon */}
                        <svg
                            width="120"
                            height="120"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="relative z-10 text-green-400 transition-all duration-150"
                            style={{
                                transform: `scale(${scale})`,
                                filter: `drop-shadow(0 0 ${glowIntensity}px currentColor)`,
                            }}
                        >
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" x2="12" y1="19" y2="22"></line>
                        </svg>

                        {/* Volume bars under microphone */}
                        <div className="absolute -bottom-12 flex gap-1.5">
                            {[...Array(7)].map((_, i) => {
                                const barHeight = Math.max(4, micVolume * 40 * (1 - Math.abs(i - 3) * 0.15));
                                return (
                                    <div
                                        key={i}
                                        className="w-1.5 rounded-full bg-green-400 transition-all duration-75"
                                        style={{
                                            height: `${barHeight}px`,
                                            opacity: 0.3 + micVolume * 0.7,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}