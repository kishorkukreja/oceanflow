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

const SUGGESTED_QUESTIONS = [
  "What are current Shanghai to LA rates?",
  "How long are transit times to the US West Coast?", 
  "Which carriers offer the best rates this week?",
  "What's the market forecast for next quarter?",
  "Compare quotes for my upcoming shipment",
  "Any port congestion alerts I should know about?"
];

const MOCK_RESPONSES = {
  // Rate-related questions
  'shanghai': [
    "📊 **Current Shanghai-LA Rates:**\n\n• Spot Rate: $2,420-2,650 per TEU\n• Contract Rate: $2,100-2,300 per TEU\n• Market Trend: ↓ 8% vs last week\n• Best Carriers: COSCO ($2,420), MSC ($2,580)\n\nRecommendation: Strong booking opportunity with rates 12% below peak season average.",
    "Current Shanghai to LA rates are at $2,420-2,650/TEU. This is an excellent booking window - rates have dropped 8% this week and are 12% below seasonal peaks. COSCO offers the best value at $2,420/TEU."
  ],
  'rate': [
    "📈 **Rate Analysis Summary:**\n\n• Trans-Pacific: $2,400-2,800/TEU (trending down)\n• Trans-Atlantic: $1,800-2,200/TEU (stable)\n• Asia-Europe: $1,200-1,600/TEU (volatile)\n\nSCFI Index: 1,247 (+3.2% WoW)\nMarket outlook: Cautiously optimistic for Q4",
    "Current market rates show mixed signals. Trans-Pacific routes average $2,600/TEU, down from September peaks. I recommend securing Q4 capacity now while rates are stabilizing.",
    "Based on our rate analytics, you're looking at $2,400-2,800/TEU for most Asia-USWC routes. Peak season surcharges are ending, creating good booking opportunities."
  ],
  'rates': [
    "Spot rates breakdown by major lanes:\n\n🌏 **Asia-USWC:** $2,400-2,800\n🌍 **Asia-USEC:** $3,200-3,600\n🚢 **Trans-Atlantic:** $1,800-2,200\n⚓ **Asia-Europe:** $1,200-1,600\n\nAll rates per TEU, including fuel surcharges.",
    "Contract vs spot rate spread is currently 20-25%. Long-term agreements offer predictability but less flexibility. Current market favors short-term bookings."
  ],
  
  // Vendor/carrier questions
  'vendor': [
    "🚢 **Top Carrier Analysis for Your Routes:**\n\n🥇 **MSC** - Premium Service\n• Rate: $2,580/TEU\n• Transit: 18.5 days\n• Reliability: 94%\n• Best for: Consistent schedules\n\n🥈 **COSCO** - Best Value\n• Rate: $2,420/TEU ⭐\n• Transit: 19.2 days\n• Reliability: 89%\n• Best for: Cost-conscious shippers\n\n🥉 **Evergreen** - Balanced Choice\n• Rate: $2,510/TEU\n• Transit: 18.8 days\n• Reliability: 91%\n• Best for: Reliable mid-tier option",
    "Carrier comparison based on Q3 performance: MSC leads in reliability (94%) but COSCO wins on price ($2,420/TEU vs $2,580). For your volume, I'd recommend a COSCO-MSC split: 70% COSCO for savings, 30% MSC for critical shipments."
  ],
  'carrier': [
    "📊 **Carrier Scorecard (Updated Weekly):**\n\n🏆 **Premium Tier:**\n• Hapag-Lloyd: 96% OTP, +$300 premium\n• MSC: 94% OTP, market rates\n• Maersk: 93% OTP, +$150 premium\n\n⚖️ **Value Tier:**\n• COSCO: 89% OTP, -$160 discount\n• OOCL: 90% OTP, -$120 discount\n• Evergreen: 91% OTP, market rates\n\nRecommendation depends on your priority: cost vs reliability.",
    "For time-critical cargo, premium carriers offer express services: Hapag-Lloyd Express (14 days, +20% rate), MSC Santana (15 days, +15% rate). Standard service delays currently 2-3 days due to port congestion."
  ],
  
  // Quote-related questions
  'quote': [
    "📋 **Your Quote Analysis:**\n\n**MSC Quote #Q-2024-0847:**\n• Rate: $2,650/TEU\n• Transit: 18 days\n• Valid until: Tomorrow 5PM\n• Market position: 8% below average ✅\n\n**Recommendation:** Excellent rate - 12% below peak season. High reliability carrier. Suggest booking 60% of Q4 volume.",
    "I found 3 competitive quotes for Shanghai-LA:\n\n🥇 COSCO: $2,420/TEU (19 days) ⭐ Best Rate\n🥈 OOCL: $2,480/TEU (18 days) ⚖️ Best Balance\n🥉 MSC: $2,580/TEU (17 days) 🚀 Fastest\n\nWould you like me to prepare a detailed comparison with terms analysis?"
  ],
  'quotes': [
    "📊 **Quote Portfolio Status:**\n\n**Active Quotes:** 8 total\n• ✅ Accepted: 3 this week\n• ⏳ Pending: 5 (avg. $2,520/TEU)\n• ⚠️ Expiring today: 2\n• 📈 Rate spread: $180/TEU\n\n**Action Items:**\n1. Review expiring quotes (MSC, OOCL)\n2. Counter-offer on Evergreen quote\n3. Request volume discounts from COSCO",
    "Quote analysis reveals fuel surcharges averaging $240/TEU (18% of total rate). Consider all-in pricing for budget predictability. COSCO and MSC offer fuel-inclusive options."
  ],
  
  // Transit time questions
  'transit': [
    "⏱️ **Shanghai-LA Transit Times:**\n\n• Standard Service: 18-22 days\n• Express Service: 14-16 days\n• Economy Service: 24-28 days\n\n🚨 Current delays: LA/LB ports +2-3 days due to peak season congestion\n\n💡 Alternative: Consider Oakland (OAK) for faster clearance.",
    "Transit time analysis for your route shows 16-21 days average. Current LA port congestion adds 2-3 days. I recommend Oakland or Seattle for faster clearance - only 1-day delays vs 3 days at LA.",
    "Current transit performance:\n\n🥇 MSC: 18.5 days avg (94% on-time)\n🥈 COSCO: 19.2 days avg (89% on-time)\n🥉 Evergreen: 20.1 days avg (91% on-time)\n\nPremium services available for time-critical cargo."
  ],
  'delivery': [
    "Your last 10 shipments averaged 18.5 days Shanghai-LA. Peak season may add 2-4 days due to port congestion.",
    "For time-critical cargo, air freight costs $4.80/kg vs ocean at $0.12/kg. Transit time: 3-5 days vs 18-21 days."
  ],
  
  // Market questions
  'market': [
    "📊 **Market Intelligence Report:**\n\n📈 **Indices:**\n• SCFI: 1,247 (+3.2% WoW)\n• CCFI: 1,156 (+1.8% WoW)\n• Baltic Dry: 1,423 (+8.3% WoW)\n\n🔮 **Outlook:**\n• Q4 2024: Rate stabilization expected\n• Q1 2025: 10-15% decline likely\n• New capacity: 2.3M TEU entering market\n\n💡 Strategy: Book Q4 now, wait for Q1 contracts.",
    "Current market shows mixed signals. Container rates stabilizing after peak season volatility, but bulk rates surging (+8.3% Baltic Dry). Fuel costs stable, but geopolitical tensions creating supply chain uncertainties."
  ],
  'forecast': [
    "🔮 **6-Month Market Forecast:**\n\n**Q4 2024:** Rate stabilization around $2,400-2,600/TEU\n**Q1 2025:** Expected 10-15% decline to $2,100-2,300/TEU\n**Q2 2025:** Recovery begins, rates trending up\n\n**Key Drivers:**\n• New vessel deliveries (+2.3M TEU capacity)\n• Demand normalization post-peak season\n• Potential labor negotiations at US ports\n\n**Recommendation:** Secure Q4 capacity, delay Q1 contracts.",
    "Market sentiment survey shows 65% of shippers delaying bookings, expecting further declines. However, early Q1 capacity may tighten due to Chinese New Year. Balanced approach recommended."
  ],
  
  // General/default responses
  'default': [
    "🤖 **How I Can Help You:**\n\n📊 **Market Intelligence**\n• Real-time rate analysis\n• Carrier performance metrics\n• Market forecasts & trends\n\n🚢 **Operational Support**\n• Transit time optimization\n• Carrier comparisons\n• Quote analysis & recommendations\n\n💡 **Strategic Insights**\n• Cost-saving opportunities\n• Risk assessment\n• Capacity planning\n\nWhat specific challenge can I help you solve today?",
    "I have access to real-time market data covering 450+ trade lanes, performance metrics for 25+ carriers, and predictive analytics for market trends. How can I assist you today?",
    "I can analyze your shipping requirements and provide data-driven recommendations. Would you like to discuss rates, transit optimization, or carrier selection?",
    "Welcome to your maritime logistics command center! I can provide insights on market conditions, optimal routing, carrier performance, and cost optimization strategies. What's your priority today?"
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
    const currentInput = inputValue; // Store current input
    setInputValue("");
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: generateResponse(currentInput),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 800 + Math.random() * 1500); // Faster response for better UX
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
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] flex flex-col shadow-xl z-50" data-testid="chatbot-window">
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
        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTED_QUESTIONS.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-left justify-start h-auto p-2 text-xs"
                  onClick={() => {
                    setInputValue(question);
                    handleSendMessage();
                  }}
                  data-testid={`suggested-question-${index}`}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

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