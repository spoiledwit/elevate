"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, AlertCircle, Send, Mic, Phone } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useElevenLabs, ConnectionState } from "@/hooks/useElevenLabs";
import milo from "@/assets/milo.gif";

export function MiloChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [mode, setMode] = useState<'text' | 'voice' | null>(null); // null = user hasn't chosen yet

  const messagesRef = useRef(messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Shared message handler
  const handleMessage = useCallback((message: any) => {
    const messageText = message.message;
    const source = message.source;
    const isAiMessage = source === 'ai';

    if (isAiMessage && messageText) {
      const newMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        ...messagesRef.current,
        { role: 'assistant' as const, content: messageText }
      ];
      setMessages(newMessages);
    }
  }, []);

  // Text mode instance
  const textChat = useElevenLabs({
    mode: 'text',
    onError: (error) => console.error("Milo Text Error:", error),
    onStateChange: (state) => console.log("Milo Text State:", state),
    onMessage: handleMessage,
  });

  // Voice mode instance
  const voiceChat = useElevenLabs({
    mode: 'voice',
    onError: (error) => console.error("Milo Voice Error:", error),
    onStateChange: (state) => console.log("Milo Voice State:", state),
    onMessage: handleMessage,
  });

  // Active chat based on mode
  const activeChat = mode === 'voice' ? voiceChat : textChat;
  const isConnected = activeChat.isConnected;
  const error = activeChat.error;

  const handleClose = useCallback(() => {
    if (isConnected) {
      activeChat.disconnect();
    }
    setIsOpen(false);
    setMode(null); // Reset mode when closing
  }, [isConnected, activeChat]);

  const handleVoiceClick = useCallback(async () => {
    // Switch to voice mode
    setMode('voice');

    // Connect to voice
    if (!voiceChat.isConnected) {
      await voiceChat.connect();
    }
  }, [voiceChat]);

  const handleSendMessage = useCallback(() => {
    if (!textInput.trim()) return;

    // First message sent = activate text mode
    if (mode === null) {
      setMode('text');
    }

    // Add user message to chat immediately
    const newMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...messagesRef.current,
      { role: 'user' as const, content: textInput }
    ];
    setMessages(newMessages);

    // Use text chat
    if (textChat.isConnected) {
      textChat.sendUserMessage(textInput);
    } else {
      // Auto-connect and send
      textChat.connect().then(() => {
        textChat.sendUserMessage(textInput);
      });
    }

    setTextInput("");
  }, [textInput, mode, textChat]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <>
      {/* Floating Chatbot Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 group",
          "w-16 h-16 rounded-full",
          "bg-gradient-to-br from-violet-600 via-brand-600 to-indigo-700",
          "shadow-[0_0_40px_rgba(139,92,246,0.5)]",
          "hover:shadow-[0_0_60px_rgba(139,92,246,0.8)]",
          "transition-all duration-500 transform hover:scale-110",
          "flex items-center justify-center",
          "backdrop-blur-xl border border-white/10",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
        aria-label="Open Milo"
      >
        <div className="relative w-16 h-16 flex items-center justify-center">
          <Image src={milo.src} alt="Milo" fill className="object-contain" />
        </div>
      </button>

      {/* Chat Dialog - Dark Theme */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "w-[420px] h-[700px]",
          "max-h-[85vh]",
          "bg-gradient-to-b from-gray-900/95 to-black/95",
          "backdrop-blur-2xl",
          "rounded-3xl",
          "border border-white/10",
          "shadow-[0_0_80px_rgba(139,92,246,0.3)]",
          "flex flex-col overflow-hidden",
          "transition-all duration-500 transform origin-bottom-right",
          isOpen
            ? "scale-100 opacity-100"
            : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden">
                <Image
                  src={milo.src}
                  alt="Milo"
                  fill
                  className="object-contain"
                />
              </div>
              {/* Status dot */}
              {isConnected && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-gray-900">
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg tracking-tight">
                MILO
              </h3>
              <p className="text-xs text-purple-400 font-medium">AI Assistant</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-300 group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && mode === null ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative w-24 h-24 mb-4">
                <Image src={milo.src} alt="Milo" fill className="object-contain" />
              </div>
              <h3 className="text-white font-medium text-lg mb-2">Hey! I'm Milo</h3>
              <p className="text-gray-400 text-sm text-center max-w-xs mb-6">
                Your AI assistant for social media. Choose how you'd like to communicate:
              </p>

              {/* Mode Selection Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleVoiceClick}
                  className="flex flex-col items-center gap-2 px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-2xl transition-all duration-300 shadow-lg shadow-purple-500/20"
                >
                  <Phone className="w-6 h-6 text-white" />
                  <span className="text-white font-medium text-sm">Voice</span>
                </button>

                <div className="flex flex-col items-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-300">
                  <Send className="w-6 h-6 text-gray-300" />
                  <span className="text-gray-300 font-medium text-sm">Text</span>
                </div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative w-24 h-24 mb-4">
                <Image src={milo.src} alt="Milo" fill className="object-contain" />
              </div>
              {mode === 'voice' && voiceChat.isConnecting && (
                <p className="text-purple-400 text-sm animate-pulse">Connecting to voice...</p>
              )}
              {mode === 'voice' && voiceChat.isListening && (
                <p className="text-purple-400 text-sm">Listening...</p>
              )}
              {mode === 'voice' && voiceChat.isSpeaking && (
                <p className="text-green-400 text-sm">Speaking...</p>
              )}
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      msg.role === 'user'
                        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                        : "bg-white/10 text-white border border-white/20"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-400/30 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Voice Status Bar - Only show in voice mode */}
        {mode === 'voice' && voiceChat.isConnected && (
          <div className="flex-shrink-0 border-t border-white/10 py-4 px-6">
            <div className="flex items-center justify-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                voiceChat.isListening ? "bg-purple-400" :
                  voiceChat.isSpeaking ? "bg-green-400" : "bg-blue-400"
              )} />
              <span className="text-sm text-gray-300 uppercase tracking-wider">
                {voiceChat.isListening ? "Listening..." :
                  voiceChat.isSpeaking ? "Speaking..." : "Voice Active"}
              </span>
              <button
                onClick={() => {
                  voiceChat.disconnect();
                  setMode(null);
                  setMessages([]);
                }}
                className="ml-auto p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Text Input Area - Only show when not in active voice call */}
        {mode !== 'voice' && (
          <div className="flex-shrink-0 border-t border-white/10 p-4">
            <div className="flex items-end gap-2">
              {/* Text Input */}
              <div className="flex-1">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message to Milo..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400/50 resize-none transition-colors"
                  rows={2}
                  style={{ maxHeight: '100px' }}
                />
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={!textInput.trim()}
                className={cn(
                  "p-3 rounded-xl transition-all duration-300 flex-shrink-0",
                  textInput.trim()
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20"
                    : "bg-white/5 text-gray-500 cursor-not-allowed"
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        )}
      </div>
    </>
  );
}
