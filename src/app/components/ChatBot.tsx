'use client';
import { useState, useEffect, useTransition, useRef, FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Send, MessageCircle } from 'lucide-react';
import Logo from './logo';

type Message = {
    id: number;
    text: string;
    sender: 'user' | 'ai';
};

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: 'Hi! How can I help you today?', sender: 'ai' },
    ]);
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const [input, setInput] = useState('');
    const [isPending, startTransition] = useTransition();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageIdRef = useRef(2);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Scroll to bottom whenever messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Reset hasNewMessage when the chat is opened
    useEffect(() => {
        if (isOpen) setHasNewMessage(false);
    }, [isOpen]);

    // Handle user's message send
    const handleSend = async (e?: FormEvent) => {
        e?.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isPending) return;

        // Add user's message
        const userMessage: Message = {
            id: messageIdRef.current++,
            text: trimmed,
            sender: 'user',
        };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        console.log('User message sent:', trimmed);

        // Fetch AI response
        startTransition(async () => {
            try {
                const response = await fetch('/api/chatbot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: trimmed }),
                });

                if (response.ok) {
                    const data = await response.json();
                    const aiMessage: Message = {
                        id: messageIdRef.current++,
                        text: data.text || 'I received your message!',
                        sender: 'ai',
                    };
                    setMessages((prev) => [...prev, aiMessage]);

                    // Notify of new message if chat is closed

                    setHasNewMessage(true);
                } else {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: messageIdRef.current++,
                            text: 'Error: Failed to get AI response.',
                            sender: 'ai',
                        },
                    ]);
                }
            } catch (error) {
                console.error('Fetch error:', error);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: messageIdRef.current++,
                        text: 'Error: Network or server issue.',
                        sender: 'ai',
                    },
                ]);
            }
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
                <div className="bg-black border-2 border-red-950 rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-red-900 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                <MessageCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">
                                    <Logo size={100} />
                                </h3>
                                <p className="text-red-100 mt-2 text-xs">
                                    Chat with Crashify Assistant
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

                    {/* Messages */}
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
                                    <ReactMarkdown>
                                        {message.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {isPending && (
                            <div className="flex justify-start">
                                <div className="bg-zinc-800 text-gray-100 border border-zinc-700 rounded-2xl rounded-bl-none px-4 py-3">
                                    <div className="flex gap-1">
                                        <span
                                            className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                                            style={{ animationDelay: '0ms' }}
                                        ></span>
                                        <span
                                            className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                                            style={{ animationDelay: '150ms' }}
                                        ></span>
                                        <span
                                            className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                                            style={{ animationDelay: '300ms' }}
                                        ></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={handleSend}
                        className="p-4 bg-zinc-900 border-t border-zinc-800"
                    >
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message..."
                                disabled={isPending}
                                className="flex-1 bg-zinc-800 text-white border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-zinc-500 text-sm sm:text-base disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={isPending || !input.trim()}
                                className="bg-gradient-to-r from-red-600 to-red-700 text-white p-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 active:scale-95 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
                    isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                } bg-gradient-to-r from-red-600 to-red-700 text-white border border-gray-200
                backdrop-blur-lg
                    rounded-full p-4 sm:p-5 shadow-2xl shadow-red-600/50 hover:from-red-700 hover:to-red-800 active:scale-95 group`}
                aria-label="Open chat"
            >
                <MessageCircle className="w-8 h-8" />
                {hasNewMessage && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse" />
                )}
            </button>
        </>
    );
}
