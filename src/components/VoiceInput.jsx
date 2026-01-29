'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, AlertCircle } from 'lucide-react';

export default function VoiceInput({ onTranscript }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef(null);
    const transcriptRef = useRef(''); // Use ref to avoid stale closure

    useEffect(() => {
        // Check if browser supports Web Speech API
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (!SpeechRecognition) {
                setIsSupported(false);
                return;
            }

            // Initialize Speech Recognition
            const recognition = new SpeechRecognition();
            recognition.lang = 'th-TH'; // Thai language
            recognition.continuous = true; // Keep listening until stopped
            recognition.interimResults = true; // Show interim results
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                console.log('Speech recognition started');
                setIsListening(true);
                transcriptRef.current = ''; // Reset ref
            };

            recognition.onresult = (event) => {
                console.log('📢 [onresult] Event triggered', event.results.length);
                let interimText = '';
                let finalText = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcriptPart = event.results[i][0].transcript;
                    console.log(`  Result ${i}: "${transcriptPart}" (final: ${event.results[i].isFinal})`);

                    if (event.results[i].isFinal) {
                        finalText += transcriptPart + ' ';
                    } else {
                        interimText += transcriptPart;
                    }
                }

                if (finalText) {
                    transcriptRef.current = transcriptRef.current + finalText;
                    setTranscript(transcriptRef.current);
                    console.log('✅ [onresult] Updated transcript:', transcriptRef.current);
                }
                setInterimTranscript(interimText);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'no-speech') {
                    console.log('No speech detected');
                }
            };

            recognition.onend = () => {
                console.log('Speech recognition ended');
                setIsListening(false);

                // Send transcript to parent after recognition ends
                setTimeout(() => {
                    const finalTranscript = transcriptRef.current.trim();
                    console.log('🎤 [VoiceInput] Sending transcript on end:', finalTranscript);
                    if (onTranscript && finalTranscript) {
                        onTranscript(finalTranscript);
                    }
                }, 100);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [onTranscript]); // Removed transcript from dependencies

    const handleClick = () => {
        if (!isSupported) {
            alert('เบราว์เซอร์ของคุณไม่รองรับการบันทึกเสียง กรุณาใช้ Chrome, Edge หรือ Safari');
            return;
        }

        if (!isListening) {
            // Start listening
            setTranscript('');
            setInterimTranscript('');
            transcriptRef.current = ''; // Also reset ref
            try {
                recognitionRef.current?.start();
            } catch (error) {
                console.error('Error starting recognition:', error);
            }
        } else {
            // Stop listening - transcript will be sent in onend event
            try {
                recognitionRef.current?.stop();
            } catch (error) {
                console.error('Error stopping recognition:', error);
            }
        }
    };

    const currentText = transcript + (interimTranscript ? ' ' + interimTranscript : '');

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            {!isSupported && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3 max-w-md">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-800">
                        <p className="font-medium mb-1">เบราว์เซอร์ไม่รองรับ</p>
                        <p>กรุณาใช้ Chrome, Edge หรือ Safari เพื่อใช้งานฟีเจอร์บันทึกเสียง</p>
                    </div>
                </div>
            )}

            <div className="relative">
                {/* Pulsing ring animation when listening */}
                {isListening && (
                    <div className="absolute inset-0 bg-red-500 rounded-full pulse-ring"></div>
                )}

                {/* Microphone button */}
                <button
                    onClick={handleClick}
                    disabled={!isSupported}
                    className={`
            relative z-10 w-24 h-24 sm:w-32 sm:h-32 rounded-full 
            flex items-center justify-center
            transition-all duration-300 shadow-2xl
            ${isListening
                            ? 'bg-red-500 hover:bg-red-600 scale-110'
                            : 'bg-green-600 hover:bg-green-700 hover:scale-105'
                        }
            ${!isSupported ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
          `}
                    aria-label={isListening ? 'กำลังฟัง...' : 'กดเพื่อพูด'}
                >
                    <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </button>
            </div>

            {/* Status text */}
            <p className="text-lg font-medium text-gray-700">
                {isListening ? '🎤 กำลังฟัง... (กดอีกครั้งเพื่อหยุด)' : '👆 กดปุ่มเพื่อเริ่มพูด'}
            </p>

            {/* Real-time transcript display */}
            {currentText && (
                <div className="w-full max-w-2xl bg-blue-50 border border-blue-200 rounded-xl p-4 mt-2">
                    <p className="text-sm font-medium text-blue-700 mb-2">
                        {isListening ? '📝 กำลังพูด...' : '✅ บันทึกเสร็จแล้ว'}
                    </p>
                    <p className="text-gray-800 leading-relaxed">
                        {transcript}
                        {interimTranscript && (
                            <span className="text-gray-500 italic">{interimTranscript}</span>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
}
