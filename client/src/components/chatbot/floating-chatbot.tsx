import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const MOCK_RESPONSES = {
  // Rate-related questions
  'rate': [
    "Current spot rates from Shanghai to LA are trending at $2,400-2,800 per TEU. The SCFI index shows a 3.2% increase this week.",
    "Based on our analysis, rates are expected to stabilize around $2,600 per TEU for Q4. Consider booking now to lock in current pricing.",
    "Historical data shows rates typically peak in September-October. Current rates are 15% above seasonal average."
  ],
  'rates': [
    "Spot rates vary by lane: Asia-USWC ($2,400-2,800), Asia-USEC ($3,200-3,600), Trans-Pacific routes show strongest volatility.",
    "Contract rates are currently 20-25% below spot rates. Long-term agreements offer better stability but less flexibility."
  ],
  
  // Vendor/carrier questions
  'vendor': [
    "Top carriers on your routes include COSCO, MSC, and Evergreen. COSCO offers best rates but longer transit times.",
    "Based on performance metrics, MSC has 94% on-time delivery and competitive rates. Would you like a detailed comparison?"
  ],
  'carrier': [
    "Carrier reliability scores: MSC (94%), COSCO (89%), Evergreen (91%). Consider service quality vs price trade-offs.",
    "For urgent shipments, premium carriers like Hapag-Lloyd offer expedited services at 15-20% higher rates."
  ],
  
  // Quote-related questions
  'quote': [
    "Your latest quote from MSC shows $2,650/TEU Shanghai-LA with 18-day transit. This is 8% below market average.",
    "I found 3 competitive quotes for your route. The best rate is $2,420/TEU with 21-day transit. Shall I prepare a comparison?"
  ],
  'quotes': [
    "Active quotes: 5 pending, 2 expiring today, 3 accepted this week. Average rate spread is $180/TEU across carriers.",
    "Quote analysis shows fuel surcharges averaging $240/TEU. Consider quotes with fuel-inclusive pricing for better predictability."
  ],
  
  // Transit time questions
  'transit': [
    "Average transit time Shanghai-LA: 16-21 days depending on carrier and service. Express services available in 14-15 days.",
    "Current congestion at LA ports adds 2-3 days to standard transit times. Consider alternative ports like Long Beach."
  ],
  'delivery': [
    "Your last 10 shipments averaged 18.5 days Shanghai-LA. Peak season may add 2-4 days due to port congestion.",
    "For time-critical cargo, air freight costs $4.80/kg vs ocean at $0.12/kg. Transit time: 3-5 days vs 18-21 days."
  ],
  
  // Market questions
  'market': [
    "Market outlook: Rates expected to decline 10-15% in Q1 2024 due to increased capacity. Consider short-term contracts.",
    "Current market volatility is high. Baltic Dry Index up 8.3%, fuel costs stable. Recommend risk hedging strategies."
  ],
  'forecast': [
    "6-month forecast shows rate stabilization around $2,200-2,500/TEU. New capacity additions will pressure rates downward.",
    "Market sentiment is cautious. 65% of shippers are delaying bookings, expecting further rate declines."
  ],
  
  // General/default responses
  'default': [
    "I can help you with rates, transit times, carrier comparisons, and market insights. What specific information do you need?",
    "I have access to real-time market data, carrier performance metrics, and pricing analytics. How can I assist you today?",
    "Let me analyze your shipping requirements and provide recommendations. Could you specify your route or cargo details?",
    "I can provide insights on current market conditions, optimal routing options, and cost-saving opportunities. What would you like to know?"
  ]
};

function generateResponse(userMessage: string): string {
  const message = userMessage.toLowerCase();
  
  // Check for keywords and return appropriate response
  for (const [key, responses] of Object.entries(MOCK_RESPONSES)) {
    if (message.includes(key) && key !== 'default') {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  
  // Return default response
  return MOCK_RESPONSES.default[Math.floor(Math.random() * MOCK_RESPONSES.default.length)];
}

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hi! I'm your maritime logistics assistant. I can help you with rates, quotes, transit times, and carrier information. What would you like to know?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: generateResponse(inputValue),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // 1-3 second delay
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-shadow z-50"
        data-testid="chatbot-toggle"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-80 h-96 flex flex-col shadow-xl z-50" data-testid="chatbot-window">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          Logistics Assistant
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setIsOpen(false)}
          data-testid="chatbot-close"
        >
          <X className="h-3 w-3" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-3 pt-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-start gap-2 max-w-[80%]">
                {message.sender === 'bot' && (
                  <Bot className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                )}
                <div
                  className={`px-3 py-2 rounded-lg text-sm ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.text}
                </div>
                {message.sender === 'user' && (
                  <User className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <Badge variant="secondary" className="animate-pulse">
                  typing...
                </Badge>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about rates, quotes, transit times..."
            className="flex-1"
            disabled={isTyping}
            data-testid="chatbot-input"
          />
          <Button
            onClick={handleSendMessage}
            size="sm"
            disabled={!inputValue.trim() || isTyping}
            data-testid="chatbot-send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}