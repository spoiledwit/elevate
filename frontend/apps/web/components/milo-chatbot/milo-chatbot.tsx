"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, AlertCircle, Send, Mic, Phone, Coins, CreditCard } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useElevenLabs, ConnectionState } from "@/hooks/useElevenLabs";
import { getCreditBalanceAction, purchaseCreditsAction, deductMiloCreditsAction, endMiloCallAction } from "@/actions";
import milo from "@/assets/milo.gif";

export function MiloChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [mode, setMode] = useState<'text' | 'voice' | null>(null); // null = user hasn't chosen yet
  const [credits, setCredits] = useState<string | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("10");
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesRef = useRef(messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const deductionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callDurationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const voiceChatRef = useRef<any>(null);
  const conversationIdRef = useRef<string | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const deductCreditsRef = useRef<typeof deductCredits | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Keep refs in sync with state
  useEffect(() => {
    conversationIdRef.current = conversationId;
    callStartTimeRef.current = callStartTime;
  }, [conversationId, callStartTime]);

  // Fetch credit balance when chatbot opens
  useEffect(() => {
    if (isOpen) {
      fetchCredits();
    }
  }, [isOpen]);

  const fetchCredits = async () => {
    setIsLoadingCredits(true);
    try {
      const balance = await getCreditBalanceAction();
      if ('error' in balance) {
        console.error('Failed to fetch credits:', balance.error);
      } else {
        setCredits(balance.milo_credits);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setIsLoadingCredits(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const result = await purchaseCreditsAction({
        amount,
        success_url: window.location.href,
        cancel_url: window.location.href,
      });

      if ('error' in result) {
        alert(result.error);
      } else {
        // Redirect to Stripe checkout
        window.location.href = result.checkout_url;
      }
    } catch (error) {
      console.error('Error purchasing credits:', error);
      alert('Failed to initiate credit purchase');
    }
  };

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

  // Store voiceChat in ref for use in callbacks
  useEffect(() => {
    voiceChatRef.current = voiceChat;
  }, [voiceChat]);

  // Active chat based on mode
  const activeChat = mode === 'voice' ? voiceChat : textChat;
  const isConnected = activeChat.isConnected;
  const error = activeChat.error;

  // Function to deduct credits for voice call
  const deductCredits = useCallback(async (convId: string, minutes: number) => {
    try {
      const result = await deductMiloCreditsAction(convId, minutes);

      if ('error' in result) {
        console.error('Failed to deduct credits:', result.error);

        // Check if insufficient credits
        if (result.required && result.available) {
          // Disconnect the call
          if (voiceChatRef.current?.isConnected) {
            voiceChatRef.current.disconnect();
          }
          setMode(null);
          setMessages([]);
        }
        return false;
      }

      // Update credit balance with new remaining balance
      setCredits(result.remaining_balance.toString());

      return true;
    } catch (error) {
      console.error('Error deducting credits:', error);
      return false;
    }
  }, []);

  // Keep deductCredits ref in sync
  useEffect(() => {
    deductCreditsRef.current = deductCredits;
  }, [deductCredits]);

  // Function to end the Milo call
  const endCall = useCallback(async (convId: string) => {
    try {
      const result = await endMiloCallAction(convId);

      if ('error' in result) {
        console.error('Failed to end call:', result.error);
      } else {
        console.log('Call ended successfully:', {
          duration: Math.ceil(result.total_duration_seconds / 60),
          creditsUsed: result.total_credits_used
        });
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, []);

  // Effect to handle credit deduction timer when voice call is active
  useEffect(() => {
    console.log('🔥 CREDIT DEDUCTION EFFECT TRIGGERED', {
      mode,
      voiceChatConnected: voiceChatRef.current?.isConnected,
      hasActiveCall: !!callStartTimeRef.current
    });

    // Only run for voice calls
    if (mode !== 'voice' || !voiceChatRef.current?.isConnected) {
      console.log('❌ NOT VOICE MODE OR NOT CONNECTED - CLEANING UP', {
        mode,
        isConnected: voiceChatRef.current?.isConnected
      });

      // Clean up timers if switching away from voice mode
      if (deductionTimerRef.current) {
        console.log('🧹 Clearing deduction timer');
        clearInterval(deductionTimerRef.current);
        deductionTimerRef.current = null;
      }
      if (callDurationIntervalRef.current) {
        console.log('🧹 Clearing duration timer');
        clearInterval(callDurationIntervalRef.current);
        callDurationIntervalRef.current = null;
      }
      if (callStartTimeRef.current && conversationIdRef.current) {
        console.log('📞 Ending call', conversationIdRef.current);
        // End the call when disconnecting
        endCall(conversationIdRef.current);
        setCallStartTime(null);
        setConversationId(null);
      }
      return;
    }

    // Start tracking call if not already tracking
    if (!callStartTimeRef.current && !deductionTimerRef.current) {
      console.log('🚀 STARTING CREDIT TRACKING FOR NEW CALL');
      const now = Date.now();
      setCallStartTime(now);
      callStartTimeRef.current = now; // Set ref immediately

      // Generate a unique conversation ID (using timestamp + random string)
      const newConvId = `milo_${now}_${Math.random().toString(36).substring(2, 15)}`;
      setConversationId(newConvId);
      conversationIdRef.current = newConvId; // Set ref immediately
      console.log('📝 Generated conversation ID:', newConvId);

      // Deduct first minute immediately
      console.log('💰 Deducting FIRST minute credits immediately');
      deductCredits(newConvId, 1);

      // Set up interval to deduct credits every minute
      deductionTimerRef.current = setInterval(async () => {
        if (!callStartTimeRef.current || !conversationIdRef.current || !deductCreditsRef.current) {
          console.log('⚠️ Missing refs, skipping deduction');
          return;
        }

        const currentMinutesElapsed = Math.ceil((Date.now() - callStartTimeRef.current) / 1000 / 60);
        console.log('⏰ Timer tick - minutes elapsed:', currentMinutesElapsed);

        if (currentMinutesElapsed > 1) {
          console.log('💰 Deducting credits for minute:', currentMinutesElapsed);
          const success = await deductCreditsRef.current(conversationIdRef.current, currentMinutesElapsed);

          // If deduction failed (insufficient credits), the deductCredits function will disconnect
          if (!success) {
            console.log('❌ Credit deduction FAILED - stopping timers');
            if (deductionTimerRef.current) {
              clearInterval(deductionTimerRef.current);
              deductionTimerRef.current = null;
            }
            if (callDurationIntervalRef.current) {
              clearInterval(callDurationIntervalRef.current);
              callDurationIntervalRef.current = null;
            }
          }
        }
      }, 60000); // Every 60 seconds (1 minute)
      console.log('⏰ Credit deduction timer started (60s interval)');
    } else {
      console.log('⚠️ Call already tracking, intervals preserved');
    }

    // Cleanup on unmount - but NOT on re-render
    return () => {
      // Only cleanup if we're actually disconnecting (mode changes or unmounts)
      console.log('🧹 CLEANUP FUNCTION CALLED');
    };
  }, [mode, voiceChat.isConnected]);

  const handleClose = useCallback(() => {
    if (isConnected) {
      activeChat.disconnect();
    }
    setIsOpen(false);
    setMode(null); // Reset mode when closing
  }, [isConnected, activeChat]);

  const handleVoiceClick = useCallback(async () => {
    console.log('🎤 VOICE BUTTON CLICKED', {
      credits,
      isConnected: voiceChat.isConnected,
      currentMode: mode
    });

    // Check if user has credits
    if (credits !== null && parseFloat(credits) === 0) {
      console.log('❌ NO CREDITS - blocking voice call');
      alert('You need credits to use voice calls. Please top up your account.');
      return;
    }

    console.log('✅ Credits OK, switching to voice mode');
    // Switch to voice mode
    setMode('voice');

    // Connect to voice
    if (!voiceChat.isConnected) {
      console.log('📡 Connecting to voice chat...');
      try {
        await voiceChat.connect();
        console.log('✅ Voice chat connected successfully');
      } catch (error) {
        console.error('❌ Voice chat connection failed:', error);
      }
    } else {
      console.log('⚠️ Voice chat already connected');
    }
  }, [voiceChat, credits, mode]);

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
          <div className="flex items-center gap-3">
            {/* Credit Display */}
            {!isLoadingCredits && credits !== null && (
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border",
                parseFloat(credits) === 0
                  ? "bg-red-500/10 border-red-400/30"
                  : "bg-purple-500/10 border-purple-400/30"
              )}>
                <Coins className={cn(
                  "w-4 h-4",
                  parseFloat(credits) === 0 ? "text-red-400" : "text-purple-400"
                )} />
                <span className={cn(
                  "text-sm font-semibold",
                  parseFloat(credits) === 0 ? "text-red-300" : "text-purple-300"
                )}>
                  {parseFloat(credits).toFixed(1)}
                </span>
              </div>
            )}
            <button
              onClick={handleClose}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-300 group"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </button>
          </div>
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

              {/* Show top-up UI if credits are zero */}
              {credits !== null && parseFloat(credits) === 0 ? (
                <div className="w-full max-w-sm space-y-4">
                  <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-red-300 text-sm font-medium mb-1">No Credits Available</p>
                    <p className="text-gray-400 text-xs">
                      Top up to use voice calls. Voice calls cost 0.5 credits per minute ($1 = 1 credit)
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <label className="text-gray-300 text-sm font-medium mb-2 block">
                      Amount (credits)
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="number"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        min="1"
                        max="10000"
                        className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400/50"
                        placeholder="Enter amount"
                      />
                      <button
                        onClick={handleTopUp}
                        className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl text-white font-medium transition-all duration-300 shadow-lg shadow-purple-500/20 flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pay ${topUpAmount}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {[10, 25, 50, 100].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setTopUpAmount(amount.toString())}
                          className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 text-xs font-medium transition-all"
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    Text chat is always free • Voice calls require credits
                  </p>
                </div>
              ) : (
                <>
                  {/* Mode Selection Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={handleVoiceClick}
                      disabled={credits !== null && parseFloat(credits) === 0}
                      className={cn(
                        "flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300 shadow-lg",
                        credits !== null && parseFloat(credits) === 0
                          ? "bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-purple-500/20"
                      )}
                    >
                      <Phone className="w-6 h-6 text-white" />
                      <span className="text-white font-medium text-sm">Voice</span>
                    </button>

                    <div className="flex flex-col items-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-300">
                      <Send className="w-6 h-6 text-gray-300" />
                      <span className="text-gray-300 font-medium text-sm">Text</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    Voice calls: 0.5 credits/min • Text: Free
                  </p>
                </>
              )}
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
