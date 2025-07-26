import fetch from 'node-fetch';
import { config } from '../config/index.js';

/**
 * Call Perplexity API with the given message and configuration
 */
export async function callPerplexityAPI(message, apiConfig = {}) {
  if (!config.PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key not configured');
  }

  const {
    model = 'sonar',
    temperature = 0.2,
    max_tokens = 1000
  } = apiConfig;

  const response = await fetch(config.PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: message
        }
      ],
      temperature,
      max_tokens,
      stream: false
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Perplexity API error: ${response.status} ${response.statusText}. ${
        errorData.error?.message || ''
      }`
    );
  }

  const data = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response received from Perplexity API');
  }

  return data.choices[0].message.content;
}