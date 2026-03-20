import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Send, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { useChat, type ChatContext, type ToolCall } from '@/hooks/use-chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatPanelProps {
  context?: ChatContext;
}

export function ChatPanel({ context }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const { messages, isLoading, error, lastToolCalls, sendMessage, clearMessages } = useChat(context);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    sendMessage(inputValue);
    setInputValue('');
  };

  const renderToolCalls = (toolCalls: ToolCall[]) => {
    if (toolCalls.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {toolCalls.map((tc, i) => (
          <div key={i} className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800">
            <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1">
              🔧 Used tool: {tc.tool}
            </div>
            {tc.result && Array.isArray(tc.result) && tc.result.length > 0 && (
              <div className="space-y-1">
                {tc.result.map((post: any, j: number) => (
                  <div key={j} className="flex items-start gap-1">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <a 
                      href={post.blogUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex-1"
                    >
                      {post.title}
                    </a>
                    <ExternalLink className="h-3 w-3 text-blue-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">AI Study Assistant</CardTitle>
            <CardDescription className="text-sm">
              Ask questions about the Talmud text and related blog posts
            </CardDescription>
          </div>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearMessages}
              data-testid="button-clear-chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0 min-h-0">
        <ScrollArea ref={scrollRef} className={`pr-4 mb-4 ${messages.length > 0 ? 'flex-1' : ''}`}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                <p className="mb-2">Start a conversation!</p>
                <p className="text-sm">
                  Try asking: "What is this passage about?" or "Are there related blog posts?"
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${msg.role}-${i}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none
                      prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0
                      prose-strong:font-bold prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  
                  {msg.role === 'assistant' && i === messages.length - 1 && lastToolCalls.length > 0 && (
                    renderToolCalls(lastToolCalls)
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {error && (
          <Alert variant="destructive" className="mb-4" data-testid="alert-chat-error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {context && (
          <div className="mb-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Badge variant="outline" className="text-xs">
              Context: {context.range || `${context.tractate} ${context.page}${context.section !== 'all' ? `:${context.section}` : ''}`}
            </Badge>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <Textarea
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="min-h-[100px] max-h-[200px] resize-none"
            rows={4}
            data-testid="input-chat-message"
          />
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
