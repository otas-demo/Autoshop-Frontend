import axios from "../axios";

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
): Promise<AiChatResponse> => {
  const response = await axios.post("/sale-report/ai-chat", {
    message,
    storefrontId,
  });
  return response.data;
};
