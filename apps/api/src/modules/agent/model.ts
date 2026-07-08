import Anthropic from '@anthropic-ai/sdk';
import { betaTool } from '@anthropic-ai/sdk/helpers/beta/json-schema';
import type { AgentModel } from './types';

export interface AnthropicModelConfig {
  apiKey?: string;
  /** Override the model id (default claude-opus-4-8). */
  model?: string;
  /** Thinking/output effort — "low" keeps WhatsApp latency snappy. */
  effort?: 'low' | 'medium' | 'high';
}

/** Cap on request→tools→request cycles per inbound message. */
const MAX_ITERATIONS = 6;

/**
 * Anthropic implementation of the AgentModel seam. Uses the SDK's tool
 * runner: it calls the API, executes our tools when the model requests them,
 * feeds results back, and returns the final message.
 */
export function createAnthropicAgentModel(
  config: AnthropicModelConfig = {},
): AgentModel {
  const client = new Anthropic(
    config.apiKey ? { apiKey: config.apiKey } : undefined,
  );
  const model = config.model || 'claude-opus-4-8';
  // Guard against a bad env value — an invalid effort would 400 every turn.
  const effort = (['low', 'medium', 'high'] as const).includes(
    config.effort as never,
  )
    ? (config.effort as 'low' | 'medium' | 'high')
    : 'low';

  return {
    async reply(request) {
      const toolCalls: string[] = [];
      const tools = request.tools.map((definition) =>
        betaTool({
          name: definition.name,
          description: definition.description,
          // Our seam keeps schemas as plain JSON Schema objects; betaTool's
          // generic wants a literal type it can infer from, so cast here at
          // the adapter boundary.
          inputSchema: definition.inputSchema as never,
          run: async (input: unknown) => {
            toolCalls.push(definition.name);
            return definition.run(input);
          },
        }),
      );

      const finalMessage = await client.beta.messages.toolRunner({
        model,
        max_tokens: 16000,
        thinking: { type: 'adaptive' },
        output_config: { effort },
        max_iterations: MAX_ITERATIONS,
        system: [
          {
            type: 'text',
            text: request.system,
            // The system prompt is byte-stable — cache it across turns.
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: request.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        tools,
      });

      const text = finalMessage.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n')
        .trim();

      return { text, toolCalls };
    },
  };
}
