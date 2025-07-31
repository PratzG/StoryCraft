import { jsonrepair } from 'jsonrepair';

export function extractJsonFromResponse(response: string): any {
  // Step 1: Clean markdown fences
  const cleaned = response.replace(/```(?:json)?/g, '').trim();

  // Step 2: Extract JSON object (first occurrence)
  const jsonMatch = cleaned.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    console.error("No JSON found. Response (first 200 chars):", cleaned.slice(0, 200));
    throw new Error("No JSON found in response.");
  }

  const jsonString = jsonMatch[0];

  // Step 3: Parse with fallback repair
  try {
    return JSON.parse(jsonString);
  } catch (parseErr) {
    console.warn("⚠ JSON parsing failed. Attempting repair...");
    try {
      return JSON.parse(jsonrepair(jsonString));
    } catch (repairErr) {
      console.warn("Repair of matched JSON failed. Trying entire response...");
      return JSON.parse(jsonrepair(cleaned));
    }
  }
}