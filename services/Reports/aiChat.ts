import axios from "../axios";
import type { ChatMessage } from "../../types";

export interface AiChatResponse {
  success: boolean;
  data: {
    response: string;
    toolCalls: string[];
  };
}

export const sendAiChatMessage = async (
  message: string,
  storefrontId: string,
  conversationHistory?: ChatMessage[],
): Promise<AiChatResponse> => {
  const response = await axios.post("/sale-report/ai-chat", {
    message,
    storefrontId,
    conversationHistory,
  });
  return response.data;
};
