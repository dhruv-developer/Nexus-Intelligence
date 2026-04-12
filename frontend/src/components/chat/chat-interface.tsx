'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, TrendingUp, Search, BarChart3, Sparkles, Lightbulb, ArrowRight } from 'lucide-react';
import { chatService } from '@/lib/api';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  insights?: {
    headline: string;
    explanation: string;
    confidence: number;
    chartData?: any;
  };
}

const quickPrompts = [
  { 
    icon: TrendingUp, 
    text: "Why did sales drop last month?",
    description: "Analyze revenue trends"
  },
  { 
    icon: Search, 
    text: "Which region performed best?",
    description: "Compare regional performance"
  },
  { 
    icon: BarChart3, 
    text: "Forecast next quarter",
    description: "Generate predictions"
  },
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI decision intelligence assistant. I can help you analyze data, generate forecasts, and provide actionable insights. What would you like to explore today?',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Call backend API
      const response = await chatService.sendMessage(inputValue);
      
      setIsTyping(false);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.message,
        timestamp: new Date(response.timestamp),
        insights: response.insights ? {
          headline: response.insights.headline || 'Analysis Complete',
          explanation: response.insights.explanation || 'Query processed successfully',
          confidence: response.confidence,
        } : undefined,
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      setIsTyping(false);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickPrompt = (prompt: typeof quickPrompts[0]) => {
    setInputValue(prompt.text);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} fade-in`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div
              className={`
                ${message.type === 'user' 
                  ? 'chat-message-user hover-lift' 
                  : 'chat-message-ai hover-glow'
                }
                slide-up
              `}
            >
              <p className="text-responsive-sm whitespace-pre-wrap">{message.content}</p>
              
              {message.insights && (
                <div className="mt-3 p-4 bg-muted/50 rounded-lg border border-border/50 insight-card slide-up">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-nexus-100 dark:bg-nexus-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-4 h-4 text-nexus-600 dark:text-nexus-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-2 text-foreground">{message.insights.headline}</h4>
                      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{message.insights.explanation}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-nexus-500 rounded-full"></div>
                            <span className="text-xs text-muted-foreground">
                              Confidence: {Math.round(message.insights.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        <button className="btn-ghost text-xs px-2 py-1">
                          View Details
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-xs mt-2 opacity-60 text-muted-foreground">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start fade-in">
            <div className="chat-message-thinking">
              <div className="flex items-center space-x-2">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="text-sm text-muted-foreground">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        {isLoading && !isTyping && (
          <div className="flex justify-start fade-in">
            <div className="chat-message-thinking">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-nexus-500" />
                <span className="text-sm text-muted-foreground">Analyzing your data...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length === 1 && !isLoading && (
        <div className="px-4 py-3 border-t border-border bg-card/50">
          <div className="text-sm font-medium text-foreground mb-3 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-nexus-500" />
            Try asking:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleQuickPrompt(prompt)}
                className="flex items-center space-x-3 p-3 bg-muted hover:bg-muted/80 rounded-lg text-left transition-all duration-200 hover-lift group"
              >
                <div className="w-8 h-8 bg-nexus-100 dark:bg-nexus-900 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <prompt.icon className="w-4 h-4 text-nexus-600 dark:text-nexus-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{prompt.text}</div>
                  <div className="text-xs text-muted-foreground">{prompt.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your data, request forecasts, or explore insights..."
              className="input-field pr-12"
              disabled={isLoading}
            />
            {inputValue && (
              <button
                onClick={() => setInputValue('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="btn-primary hover-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* Character count and hints */}
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-muted-foreground">
            {inputValue.length > 0 && (
              <>
                {inputValue.length} characters
                {inputValue.length > 500 && (
                  <span className="text-orange-500 ml-2">Consider being more concise</span>
                )}
              </>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
