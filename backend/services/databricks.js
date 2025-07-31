import fetch from 'node-fetch';
import { config } from '../config/index.js';

/**
 * Call a Databricks-hosted LLM endpoint (chat-based) using a Personal Access Token.
 * 
 * @param {string} message - The user message or prompt.
 * @param {object} apiConfig - Optional configuration for temperature, max_tokens, etc.
 * @returns {Promise<string>} - The response content from the LLM.
 */
export async function callDatabricksLLM(message, apiConfig = {}) {
  if (!config.DATABRICKS_HOST || !config.DATABRICKS_PAT || !config.DATABRICKS_ENDPOINT) {
    throw new Error('Databricks HOST, PAT, or ENDPOINT not configured.');
  }

  const {
    temperature = 0.2,
    max_tokens = 500
  } = apiConfig;

  const url = `${config.DATABRICKS_HOST}/serving-endpoints/${config.DATABRICKS_ENDPOINT}/invocations`;

  // Construct a chat-compatible payload
  const body = {
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: message }
    ],
    temperature,
    max_tokens
  };

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.DATABRICKS_PAT}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  } catch (err) {
    throw new Error(`Network error while calling Databricks API: ${err.message}`);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Databricks API error: ${response.status} ${response.statusText}. ${
        errorData.error?.message || ''
      }`
    );
  }

  const data = await response.json();

  // Databricks endpoints return OpenAI-style responses
  const content =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    null;

  if (!content) {
    throw new Error('No response content received from Databricks API');
  }

  return content;
}