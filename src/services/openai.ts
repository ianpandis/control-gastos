import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Solo para desarrollo, idealmente usar un backend
});

export interface AgentRequest {
  systemPrompt: string;
  pdfContent: string;
  userMessage?: string;
}

export interface AgentResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function runAgent(
  request: AgentRequest
): Promise<AgentResponse> {
  const { systemPrompt, pdfContent, userMessage } = request;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o', // Puedes cambiar el modelo según tus necesidades
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Aquí está el contenido del PDF:\n\n${pdfContent}${
          userMessage ? `\n\n${userMessage}` : ''
        }`,
      },
    ],
    temperature: 0.7,
  });

  const message = response.choices[0]?.message;
  const usage = response.usage;

  if (!message?.content) {
    throw new Error('No se recibió respuesta del agente');
  }

  return {
    content: message.content,
    usage: {
      prompt_tokens: usage?.prompt_tokens || 0,
      completion_tokens: usage?.completion_tokens || 0,
      total_tokens: usage?.total_tokens || 0,
    },
  };
}
