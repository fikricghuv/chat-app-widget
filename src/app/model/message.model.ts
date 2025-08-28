import { ENUM_SENDER } from "../constants/enum.constant";

export interface MessageModel {
  id?: string; 
  room_id?: string;
  sender: ENUM_SENDER;
  message?: string; 
  time: string; 

  fileUrl?: string;
  fileName?: string;
  fileType?: string; 

  isVoiceNote?: boolean;   
  audioUrl?: string;       
  audioDuration?: string;   
}

export interface ChatHistoryResponse {
  history: MessageModel[];
  nextCursor: string | null;
  total: number;
}
