import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const QUICK_REPLIES = [
  'How do I create a ticket?',
  'Show asset summary',
  'Who is assigned to my ticket?',
  'How to request maintenance?',
];

// Simulated bot responses — replace with real AI/RAG backend later
const getBotResponse = (userMessage: string): string => {
  const msg = userMessage.toLowerCase();

  if (msg.includes('ticket') && (msg.includes('create') || msg.includes('new') || msg.includes('how'))) {
    return 'To create a new ticket, go to the **Tickets** page from the sidebar and click the **"New Ticket"** button. Fill in the required details like title, description, priority, and category, then submit.';
  }
  if (msg.includes('asset') && (msg.includes('summary') || msg.includes('status') || msg.includes('show'))) {
    return 'You can view the full asset summary on the **Dashboard** page. It shows total assets, active tickets, and status breakdowns. For detailed asset info, visit the **Assets** page.';
  }
  if (msg.includes('assign') || msg.includes('who is')) {
    return 'To check ticket assignments, open the specific ticket from the **Tickets** page. The assigned technician and status are displayed in the ticket details panel.';
  }
  if (msg.includes('maintenance') || msg.includes('request')) {
    return 'To request maintenance, navigate to the **Requests** page and submit a new maintenance request. You can specify the asset, describe the issue, and set the priority level.';
  }
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return 'Hello! 👋 I\'m your IT Support Agent. I can help you with tickets, assets, maintenance requests, and more. What would you like to know?';
  }
  if (msg.includes('thank')) {
    return 'You\'re welcome! 😊 Let me know if you need anything else.';
  }
  if (msg.includes('report') || msg.includes('reports')) {
    return 'You can access reports from the **Reports** page in the sidebar. It includes ticket analytics, asset status summaries, and performance metrics.';
  }
  if (msg.includes('schedule') || msg.includes('calendar')) {
    return 'Check the **Calendar** or **Schedules** page for upcoming maintenance schedules and task timelines.';
  }
  if (msg.includes('user') || msg.includes('users') || msg.includes('team')) {
    return 'User management is available on the **Users** page (admin access required). You can view, add, and manage team members and their roles.';
  }
  if (msg.includes('notification') || msg.includes('alert')) {
    return 'You can view all notifications by clicking the bell icon in the header or visiting the **Notifications** page. Configure notification preferences in **Settings**.';
  }

  return 'I\'m not sure about that yet, but I\'m learning! Try asking about **tickets**, **assets**, **maintenance requests**, **reports**, or **schedules**. You can also use the quick reply buttons below.';
};

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! 👋 I\'m your **IT Support Agent**. I can help you with tickets, assets, and more. How can I help you today?',
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

  const handleSend = (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(messageText),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
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
    // Simple markdown bold rendering
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
      {/* Chat Widget */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50 flex flex-col transition-all duration-500 ease-bounce-in-out',
          isOpen
            ? 'w-[400px] h-[560px] max-h-[80vh]'
            : 'w-auto h-auto'
        )}
      >
        {isOpen && (
          <div
            className={cn(
              'flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-border/50',
              'bg-background/95 backdrop-blur-xl',
              'transition-all duration-500 ease-bounce-in-out',
              isMinimized ? 'h-[60px]' : 'h-full',
            )}
            style={{
              boxShadow: '0 25px 60px -12px rgba(0,0,0,0.25), 0 0 40px rgba(0,173,197,0.1)',
            }}
          >
            {/* Header */}
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
                  <p className="text-[11px] text-white/70">Always here to help</p>
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

            {/* Messages */}
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
                      {/* Avatar */}
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

                      {/* Bubble */}
                      <div
                        className={cn(
                          'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                          message.sender === 'bot'
                            ? 'bg-muted/80 text-foreground rounded-bl-md'
                            : 'bg-[hsl(186,100%,39%)] text-white rounded-br-md'
                        )}
                      >
                        <p className="whitespace-pre-wrap">
                          {renderMessageText(message.text)}
                        </p>
                        <p
                          className={cn(
                            'text-[10px] mt-1.5',
                            message.sender === 'bot'
                              ? 'text-muted-foreground'
                              : 'text-white/60'
                          )}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
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

                {/* Quick Replies */}
                {messages.length <= 2 && (
                  <div className="px-4 pb-2 flex flex-wrap gap-2">
                    {QUICK_REPLIES.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => handleSend(reply)}
                        className="text-xs px-3 py-1.5 rounded-full border border-[hsl(186,100%,39%)]/30 text-[hsl(186,100%,39%)] hover:bg-[hsl(186,100%,39%)]/10 transition-colors duration-200"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="px-4 py-3 border-t border-border/50 bg-background/50">
                  <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-1 border border-border/30 focus-within:border-[hsl(186,100%,39%)]/50 focus-within:ring-1 focus-within:ring-[hsl(186,100%,39%)]/20 transition-all duration-200">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
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
                    AI-powered · Responses may not always be accurate
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Floating Action Button */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="self-end group relative"
            aria-label="Open chat"
          >
            {/* Pulse ring */}
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
            {/* Tooltip */}
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
