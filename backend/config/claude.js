// Anthropic Claude API configuration placeholder
import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || 'placeholder_key',
});
