'use client';
import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Minimize2 } from 'lucide-react';
import Image from 'next/image';
import image from '../../../public/chatbot.png';

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: 'Hi! How can I help you today?', sender: 'bot' },
    ]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (inputValue.trim()) {
            const newMessage = {
                id: messages.length + 1,
                text: inputValue,
                sender: 'user',
            };
            setMessages([...messages, newMessage]);
            setInputValue('');

            // Simulate bot response
            setTimeout(() => {
                const botResponse = {
                    id: messages.length + 2,
                    text: 'Thanks for your message! This is a demo response.',
                    sender: 'bot',
                };
                setMessages((prev) => [...prev, botResponse]);
            }, 1000);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Chat Window */}
            <div
                className={`fixed z-50 transition-all duration-300 ease-in-out ${
                    isOpen
                        ? 'bottom-4 right-4 w-[calc(100vw-2rem)] sm:w-96 h-[calc(100vh-2rem)] sm:h-[600px] opacity-100 scale-100'
                        : 'bottom-4 right-4 w-0 h-0 opacity-0 scale-0'
                }`}
            >
                <div className="bg-black border-2 border-red-600 rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                                <MessageCircle className="w-6 h-6 text-red-600" />
                                <Image
                                    src={image}
                                    width={40}
                                    height={40}
                                    alt="chatbot"
                                    className="w-10 h-10 rounded-full"
                                />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">
                                    Support Chat
                                </h3>
                                <p className="text-red-100 text-xs">
                                    We&apos;re online
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:bg-red-800 p-2 rounded-lg transition-colors"
                            aria-label="Close chat"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-zinc-900 to-black">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${
                                    message.sender === 'user'
                                        ? 'justify-end'
                                        : 'justify-start'
                                }`}
                            >
                                <div
                                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                                        message.sender === 'user'
                                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-br-none'
                                            : 'bg-zinc-800 text-gray-100 border border-zinc-700 rounded-bl-none'
                                    }`}
                                >
                                    <p className="text-sm sm:text-base break-words">
                                        {message.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                className="flex-1 bg-zinc-800 text-white border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent placeholder-zinc-500 text-sm sm:text-base"
                            />
                            <button
                                onClick={handleSend}
                                className="bg-gradient-to-r from-red-600 to-red-700 text-white p-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 active:scale-95 flex-shrink-0"
                                aria-label="Send message"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
                    isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                } bg-gradient-to-r from-yellow-600 to-red-700 text-white 
                    rounded-l-full rounded-b-full border-pink-500 border-r-2 border-b-2
                    animate-bounce ball
                p-4 sm:p-5 shadow-2xl hover:from-red-700 hover:to-red-800 active:scale-95 group`}
                aria-label="Open chat"
            >
                <style jsx>{`
                    @keyframes ping-pong {
                        /* 0s: Start at the bottom (Ground) */
                        0% {
                            transform: translateY(0);
                        }

                        /* First, largest bounce - occurs in the first ~15% */
                        10% {
                            transform: translateY(-100px);
                        } /* Max height */
                        20% {
                            transform: translateY(0);
                        }

                        /* Second, medium bounce - occurs in the next ~10% */
                        25% {
                            transform: translateY(-50px);
                        }
                        30% {
                            transform: translateY(0);
                        }

                        /* Third, smallest bounce - occurs in the next ~5% */
                        33% {
                            transform: translateY(-15px);
                        }
                        35% {
                            transform: translateY(0);
                        }

                        /* 3-Second Static Pause */
                        /* From 35% to 100%, the ball stays at the bottom (35% of 6s is 2.1s. The pause is 6s - 2.1s = 3.9s long) */
                        /* To get exactly a 3-second pause, the total bounce time should be 3s. */

                        /* Let's re-calculate for a 6s total: 
       - Bounce time: 3s (50% of 6s)
       - Pause time: 3s (50% of 6s) 
    */

                        /* Bounce ends at 50% */
                        50% {
                            transform: translateY(0);
                        }

                        /* **The key for the pause:** The element must hold its position (Y=0) 
       from the end of the bounce (50%) to the end of the full cycle (100%). */
                        100% {
                            transform: translateY(0);
                        }
                    }
                `}</style>

                {/* <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" /> */}
                <Image
                    src={image}
                    width={40}
                    height={40}
                    alt="chatbot"
                    className="w-10 h-10 rounded-full"
                />
                {/* Notification Dot */}
                <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse" />
            </button>
        </>
    );
}
