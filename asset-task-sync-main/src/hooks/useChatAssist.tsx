import laravelClient from '@/integrations/laravel/client';
import { Faq } from '@/integrations/laravel/client';

export interface ChatAssistResponse {
  type: 'greeting' | 'thanks' | 'faq' | 'fallback';
  text: string;
  matches?: Faq[];
}

export async function fetchChatAssist(message: string): Promise<ChatAssistResponse> {
  const response = await laravelClient.post('/chat/assist', { message });
  return response.data;
}
