import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { XMarkIcon } from './icons/XMarkIcon';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

type Message = {
  role: 'user' | 'model';
  text: string;
};

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    chatSessionRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are a friendly and helpful AI assistant for the "SA Grade 12 Script Marker" application. Your purpose is to assist teachers and administrators using this tool. 
            - You can answer questions about the app's features (uploading papers, marking scripts, viewing results).
            - You can provide general information about the South African Grade 12 curriculum and marking principles.
            - Be concise, professional, and supportive.
            - If you don't know an answer, say so politely. Do not make up information.`
        },
    });
    
    setMessages([{
        role: 'model',
        text: "Welcome to the SA Grade 12 Script Marker! I'm your AI assistant. Feel free to ask me anything about using the app or about the curriculum."
    }]);

  }, []);

  useEffect(() => {
    // Auto-scroll to the latest message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading || !chatSessionRef.current) return;

    const userMessage: Message = { role: 'user', text: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatSessionRef.current.sendMessage({ message: trimmedInput });
      const modelMessage: Message = { role: 'model', text: response.text };
      setMessages(prev => [...prev, modelMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage = "Sorry, I couldn't get a response. Please try again.";
      setError(errorMessage);
      setMessages(prev => [...prev, {role: 'model', text: errorMessage}]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);

  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-transform transform hover:scale-110"
        aria-label="Open chat"
      >
        <ChatBubbleIcon className="w-8 h-8" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-sm h-[70vh] max-h-[600px] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-slate-800 text-white flex-shrink-0">
        <h3 className="text-lg font-bold">AI Assistant</h3>
        <button
          onClick={toggleChat}
          className="p-1 rounded-full hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close chat"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-2 rounded-xl ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="max-w-[80%] px-4 py-2 rounded-xl bg-slate-200 text-slate-800">
                    <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
                    </div>
                </div>
            </div>
          )}
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2 bg-slate-100 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-full shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
