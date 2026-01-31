'use client';

import { useState, useRef, useEffect } from 'react';
import { CornerDownLeft, Languages, Mic, CircleDashed, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { multilingualLegalAssistance } from '@/ai/flows/multilingual-legal-assistance';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audio?: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('English');
  const [isLoading, setIsLoading] = useState(false);
  const [useVoice, setUseVoice] = useState(false);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo(0, scrollAreaRef.current.scrollHeight);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await multilingualLegalAssistance({ query: input, language, voice: useVoice });
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response,
        audio: result.audio,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (result.audio && audioRef.current) {
        audioRef.current.src = result.audio;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Error with chatbot:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response from the chatbot. Please try again.',
      });
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-card rounded-lg shadow-sm border">
      <header className="flex items-center justify-between p-4 border-b">
        <h2 className="font-headline text-lg">{t('chatbot.title')}</h2>
        <div className="flex items-center gap-4">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[150px]">
              <Languages className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('chatbot.language')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Hindi">Hindi</SelectItem>
              <SelectItem value="Marathi">Marathi</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={useVoice ? 'default' : 'outline'}
            size="icon"
            onClick={() => setUseVoice(!useVoice)}
            aria-label="Toggle voice output"
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-start gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="w-8 h-8 border">
                  <AvatarFallback><Bot className="w-5 h-5 text-primary" /></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-md rounded-lg px-4 py-3 text-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p>{message.content}</p>
              </div>
              {message.role === 'user' && (
                <Avatar className="w-8 h-8 border">
                  <AvatarFallback><User className="w-5 h-5 text-muted-foreground" /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <Avatar className="w-8 h-8 border">
                  <AvatarFallback><Bot className="w-5 h-5 text-primary" /></AvatarFallback>
              </Avatar>
              <div className="max-w-md rounded-lg px-4 py-3 bg-muted">
                <CircleDashed className="w-5 h-5 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <div className="relative">
          <Textarea
            placeholder={t('chatbot.placeholder', { language })}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="pr-16 min-h-[48px] resize-none"
            rows={1}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute top-1/2 right-3 -translate-y-1/2"
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
          >
            <CornerDownLeft className="w-4 h-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
