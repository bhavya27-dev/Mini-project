import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Bot, User, Loader } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage } from '@shared/schema';

export default function Chatbot() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], refetch } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/messages'],
    enabled: isOpen,
  });

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      try {
        const response = await apiRequest('POST', '/api/chat/send', { message: text, language });
        return await response.json();
      } catch (error: any) {
        // Handle 429 quota error
        if (error.message && error.message.includes('429')) {
          throw new Error(
            language === 'kn' ? 'ಕ್ಷಮಿಸಿ, ಮೌಲ್ಯದ ಮಿತಿ ಮೀರಿದೆ. ದಯವಿಟ್ಟು ಕೆಲವು ಸಮಯದ ನಂತರ ಪ್ರಯತ್ನ ಮಾಡಿ.' :
            language === 'hi' ? 'क्षमा करें, API का कोटा समाप्त हो गया है। कृपया कुछ समय बाद प्रयास करें।' :
            'Sorry, API quota exceeded. Please try again later.'
          );
        }
        throw error;
      }
    },
    onSuccess: () => {
      setMessage('');
      // Refetch messages to show the new response
      refetch();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'kn' ? 'ದೋಷ' : language === 'hi' ? 'त्रुटि' : 'Error',
        description: error.message || (language === 'kn' ? 'ಸಂದೇಶ ಕಳುಹಿಸಲು ವಿಫಲವಾಗಿದೆ' : language === 'hi' ? 'संदेश भेजने में विफल' : 'Failed to send message'),
      });
    },
  });

  const handleSend = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  const suggestedQuestions = [
    language === 'kn' ? 'ನನಗೆ ಯಾವ ಯೋಜನೆಗಳು ಅನ್ವಯವಾಗುತ್ತವೆ?' :
    language === 'hi' ? 'मेरे लिए कौन सी योजनाएं लागू होती हैं?' :
    'Which schemes am I eligible for?',
    
    language === 'kn' ? 'ಅರ್ಜಿ ಹೇಗೆ ಸಲ್ಲಿಸುವುದು?' :
    language === 'hi' ? 'आवेदन कैसे जमा करें?' :
    'How do I submit an application?',
    
    language === 'kn' ? 'ನನ್ನ ಅರ್ಜಿಯ ಸ್ಥಿತಿ ಏನು?' :
    language === 'hi' ? 'मेरे आवेदन की स्थिति क्या है?' :
    'What is my application status?',
  ];

  if (!isOpen) {
    return (
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50"
        onClick={() => setIsOpen(true)}
        data-testid="button-open-chat"
      >
        <MessageCircle className="h-8 w-8" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-screen max-h-[600px] shadow-2xl z-50 flex flex-col bg-background rounded-lg border">
      {/* Header */}
      <div className="flex flex-row items-center justify-between p-4 border-b bg-background rounded-t-lg">
        <div className="text-lg font-semibold flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          {t('chatHelp')}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          data-testid="button-close-chat"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        ref={scrollRef}
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 && !sendMessageMutation.isPending ? (
          <div className="space-y-4 flex flex-col justify-center h-full">
            <p className="text-base text-muted-foreground text-center">
              {language === 'kn' ? 'ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?' :
               language === 'hi' ? 'मैं आपकी कैसे मदद कर सकता हूं?' :
               'How can I help you today?'}
            </p>
            <div className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left justify-start h-auto py-3 px-4 hover-elevate"
                  onClick={() => sendMessageMutation.mutate(question)}
                  disabled={sendMessageMutation.isPending}
                  data-testid={`button-suggested-${index}`}
                >
                  <span className="text-sm break-words whitespace-normal">{question}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={msg.id || idx}>
                {/* User message */}
                <div className="flex items-start gap-3 justify-end mb-4">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-xs">
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                  <div className="bg-primary/20 rounded-full p-2 flex-shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                </div>
                
                {/* Bot response */}
                <div className="flex items-start gap-3 justify-start mb-4">
                  <div className="bg-muted rounded-full p-2 flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2 max-w-xs">
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.response}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {sendMessageMutation.isPending && (
              <div className="flex items-start gap-3 justify-start animate-pulse">
                <div className="bg-muted rounded-full p-2 flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2">
                  <div className="flex gap-1">
                    <Loader className="h-4 w-4 text-primary animate-spin" />
                    <span className="text-sm">
                      {language === 'kn' ? 'ಉತ್ತರ ಆಲೋಚನೆಯಲ್ಲಿದೆ...' :
                       language === 'hi' ? 'उत्तर सोच रहा हूं...' :
                       'Thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4 flex-shrink-0 rounded-b-lg">
        <div className="flex gap-2">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !sendMessageMutation.isPending) {
                handleSend();
              }
            }}
            placeholder={
              language === 'kn' ? 'ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಬರೆಯಿರಿ...' :
              language === 'hi' ? 'अपना प्रश्न लिखें...' :
              'Ask your question...'
            }
            disabled={sendMessageMutation.isPending}
            data-testid="input-chat-message"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            size="icon"
            data-testid="button-send-message"
          >
            {sendMessageMutation.isPending ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
