import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, User, Sparkles, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fetchChatAssist } from '@/hooks/useChatAssist';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  showHelpLink?: boolean;
  showRequestLink?: boolean;
}

const QUICK_REPLIES = [
  'How do I reset my password?',
  'How long until my ticket is answered?',
  'My printer is offline',
  'How do I submit a request?',
];

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your **IT Support Agent**. I search our **Help Center** articles to answer your questions. What can I help with?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const result = await fetchChatAssist(messageText);
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: result.text,
        sender: 'bot',
        timestamp: new Date(),
        showHelpLink: result.type === 'faq' || result.type === 'fallback',
        showRequestLink: result.type === 'fallback',
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't reach the help service right now. Try **Help Center** or **Submit a request**.",
        sender: 'bot',
        timestamp: new Date(),
        showHelpLink: true,
        showRequestLink: true,
      };
      setMessages((prev) => [...prev, botResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageText = (text: string) => {
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-[hsl(var(--accent))]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      <div
        className={cn(
          'fixed z-50 flex flex-col transition-all duration-500 ease-bounce-in-out',
          isOpen
            ? cn(
                'bottom-4 right-4 left-4 w-[calc(100vw-2rem)] sm:bottom-6 sm:right-6 sm:left-auto sm:w-[400px]',
                isMinimized ? 'h-[60px]' : 'h-[80vh] max-h-[600px] sm:h-[560px] sm:max-h-[80vh]'
              )
            : 'bottom-6 right-6 w-auto h-auto'
        )}
      >
        {isOpen && (
          <div
            className={cn(
              'flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-border/50',
              'bg-background/95 backdrop-blur-xl',
              'transition-all duration-500 ease-bounce-in-out',
              isMinimized ? 'h-[60px]' : 'h-full'
            )}
            style={{
              boxShadow: '0 25px 60px -12px rgba(0,0,0,0.25), 0 0 40px rgba(0,173,197,0.1)',
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none"
              style={{
                background: 'linear-gradient(135deg, hsl(186 100% 39%), hsl(186 80% 32%))',
              }}
              onClick={() => isMinimized && setIsMinimized(false)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[hsl(186,100%,39%)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">IT Support Agent</h3>
                  <p className="text-[11px] text-white/70">Powered by Help Center</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(!isMinimized);
                  }}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 chatbot-messages">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-2.5 animate-fade-in',
                        message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5',
                          message.sender === 'bot'
                            ? 'bg-[hsl(186,100%,39%)]/10'
                            : 'bg-primary/10'
                        )}
                      >
                        {message.sender === 'bot' ? (
                          <Sparkles className="h-3.5 w-3.5 text-[hsl(186,100%,39%)]" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>

                      <div
                        className={cn(
                          'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                          message.sender === 'bot'
                            ? 'bg-muted/80 text-foreground rounded-bl-md'
                            : 'bg-[hsl(186,100%,39%)] text-white rounded-br-md'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{renderMessageText(message.text)}</p>
                        {(message.showHelpLink || message.showRequestLink) && message.sender === 'bot' && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {message.showHelpLink && (
                              <Link
                                to="/help"
                                className="text-xs px-2.5 py-1 rounded-full bg-background border border-border hover:bg-muted transition-colors"
                                onClick={() => setIsOpen(false)}
                              >
                                Help Center
                              </Link>
                            )}
                            {message.showRequestLink && (
                              <Link
                                to="/requests"
                                className="text-xs px-2.5 py-1 rounded-full bg-[hsl(186,100%,39%)]/10 text-[hsl(186,100%,39%)] border border-[hsl(186,100%,39%)]/30 hover:bg-[hsl(186,100%,39%)]/20 transition-colors"
                                onClick={() => setIsOpen(false)}
                              >
                                Submit request
                              </Link>
                            )}
                          </div>
                        )}
                        <p
                          className={cn(
                            'text-[10px] mt-1.5',
                            message.sender === 'bot' ? 'text-muted-foreground' : 'text-white/60'
                          )}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-2.5 animate-fade-in">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[hsl(186,100%,39%)]/10 flex items-center justify-center mt-0.5">
                        <Sparkles className="h-3.5 w-3.5 text-[hsl(186,100%,39%)]" />
                      </div>
                      <div className="bg-muted/80 rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1.5">
                          <span className="chatbot-typing-dot" />
                          <span className="chatbot-typing-dot" style={{ animationDelay: '0.15s' }} />
                          <span className="chatbot-typing-dot" style={{ animationDelay: '0.3s' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {messages.length <= 2 && (
                  <div className="px-4 pb-2 flex flex-wrap gap-2">
                    {QUICK_REPLIES.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => handleSend(reply)}
                        disabled={isTyping}
                        className="text-xs px-3 py-1.5 rounded-full border border-[hsl(186,100%,39%)]/30 text-[hsl(186,100%,39%)] hover:bg-[hsl(186,100%,39%)]/10 transition-colors duration-200 disabled:opacity-50"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                <div className="px-4 py-3 border-t border-border/50 bg-background/50">
                  <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-1 border border-border/30 focus-within:border-[hsl(186,100%,39%)]/50 focus-within:ring-1 focus-within:ring-[hsl(186,100%,39%)]/20 transition-all duration-200">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask a question..."
                      className="flex-1 bg-transparent text-sm py-2.5 outline-none placeholder:text-muted-foreground/60"
                    />
                    <Button
                      size="icon"
                      onClick={() => handleSend()}
                      disabled={!inputValue.trim() || isTyping}
                      className={cn(
                        'h-8 w-8 rounded-lg shrink-0 transition-all duration-200',
                        inputValue.trim()
                          ? 'bg-[hsl(186,100%,39%)] hover:bg-[hsl(186,100%,34%)] text-white shadow-md'
                          : 'bg-transparent text-muted-foreground hover:bg-transparent'
                      )}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
                    FAQ-powered · Answers from Help Center articles
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="self-end group relative"
            aria-label="Open chat"
          >
            <span className="absolute inset-0 rounded-full bg-[hsl(186,100%,39%)] animate-ping opacity-20" />
            <div
              className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
              style={{
                background: 'linear-gradient(135deg, hsl(186 100% 39%), hsl(186 80% 32%))',
                boxShadow: '0 8px 25px -5px hsla(186, 100%, 39%, 0.4)',
              }}
            >
              <MessageCircle className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-110" />
            </div>
            <span className="absolute bottom-full right-0 mb-3 px-3 py-1.5 bg-foreground text-background text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg">
              IT Support Agent
              <span className="absolute top-full right-5 -mt-1 border-4 border-transparent border-t-foreground" />
            </span>
          </button>
        )}
      </div>
    </>
  );
};

export default ChatBot;
