export interface ChatHistoryResponseModel {
  id: string; 
  room_conversation_id: string; 
  sender_id: string; 
  message: string; 
  created_at: string; 
  agent_response_category: string | null; 
  agent_response_latency: string | null;
  agent_total_tokens: number | null; 
  agent_input_tokens: number | null; 
  agent_output_tokens: number | null; 
  agent_other_metrics: { [key: string]: any } | null; 
  agent_tools_call: string[] | null; 
  role: 'user' | 'admin' | 'chatbot'; 
}

export interface UserHistoryResponseModel {
  success: boolean;
  room_id: string | null; 
  user_id: string;
  history: ChatHistoryResponseModel[]; 
  next_cursor?: string | null; 
  total: number;
}

