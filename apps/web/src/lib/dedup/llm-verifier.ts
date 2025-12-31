/**
 * LLM-based Transaction Verification
 *
 * Uses OpenAI function calling for reliable, structured responses.
 * Called for transactions where deterministic matching fails but candidates exist.
 *
 * Cost: ~$0.15/1M input tokens, $0.60/1M output tokens
 * Typical batch of 20 comparisons: ~$0.0003
 */

import OpenAI from "openai";

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required for LLM verification"
      );
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export interface TransactionPair {
  newDescription: string;
  existingDescription: string;
  amount?: number;
  date?: string;
}

export interface VerificationResult {
  isSameMerchant: boolean;
  confidence: "high" | "medium" | "low";
  reasoning?: string;
}

// Function definition for structured output via function calling
const transactionMatchTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "report_transaction_matches",
    description:
      "Report whether each pair of transaction descriptions refers to the same merchant/business.",
    parameters: {
      type: "object",
      properties: {
        matches: {
          type: "array",
          description: "Array of match results for each transaction pair",
          items: {
            type: "object",
            properties: {
              pair_index: {
                type: "number",
                description: "The 1-based index of the transaction pair",
              },
              is_same_merchant: {
                type: "boolean",
                description:
                  "True if both descriptions refer to the same merchant/business",
              },
              confidence: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "Confidence level in the match determination",
              },
            },
            required: ["pair_index", "is_same_merchant", "confidence"],
            additionalProperties: false,
          },
        },
      },
      required: ["matches"],
      additionalProperties: false,
    },
    strict: true,
  },
};

/**
 * Verify multiple transaction pairs in a single API call for efficiency.
 * Uses function calling for structured, reliable output.
 *
 * @param pairs Array of transaction pairs to verify
 * @returns Array of verification results in the same order
 */
export async function verifyMatchesBatch(
  pairs: TransactionPair[]
): Promise<VerificationResult[]> {
  if (pairs.length === 0) {
    return [];
  }

  const openai = getOpenAIClient();
  const results: VerificationResult[] = [];

  // Process in batches of 20
  const batchSize = 50;

  for (let i = 0; i < pairs.length; i += batchSize) {
    const batch = pairs.slice(i, i + batchSize);
    const batchResults = await verifyBatchWithFunctionCall(openai, batch);
    results.push(...batchResults);
  }

  return results;
}

async function verifyBatchWithFunctionCall(
  openai: OpenAI,
  pairs: TransactionPair[]
): Promise<VerificationResult[]> {
  const pairDescriptions = pairs
    .map(
      (p, i) =>
        `${i + 1}. New: "${p.newDescription}"\n   Existing: "${p.existingDescription}"${
          p.amount ? `\n   Amount: $${Math.abs(p.amount).toFixed(2)}` : ""
        }${p.date ? `\n   Date: ${p.date}` : ""}`
    )
    .join("\n\n");

  const systemPrompt = `You are a financial transaction deduplication expert. Your job is to determine if transaction descriptions refer to the SAME merchant/business.

IMPORTANT CONTEXT:
- The same merchant appears differently across banks and payment processors
- "AplPay" or "Apple Pay" prefixes indicate Apple Pay was used - ignore these prefixes
- Location suffixes (city, state) should be ignored when comparing
- Store numbers and reference IDs should be ignored
- Plaid provides clean merchant names, while bank CSVs have messy raw descriptions

EXAMPLES OF MATCHES:
- "AplPay CHIPOTLE 1249GAINESVILLE VA" = "Chipotle Mexican Grill" (same restaurant chain)
- "RAISING CANES 0724 MANASSAS VA" = "Raising Cane's Chicken Fingers" (same restaurant)
- "TST* ROCKWOOD GAINESVILLE" = "Rockwood" (same restaurant, TST* is Toast payment processor)
- "SQ *COFFEESHOP" = "The Coffee Shop" (same business, SQ* is Square)

EXAMPLES OF NON-MATCHES:
- "CHIPOTLE 1249" ≠ "Taco Bell" (different restaurants, even though both are Mexican food)
- "TARGET 1234" ≠ "Walmart" (different stores, even though both are retail)

Analyze each pair carefully and call the report_transaction_matches function with your findings.`;

  try {
    const response = await openai.chat.completions.create(
      {
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Analyze these transaction pairs and determine if each pair refers to the same merchant:\n\n${pairDescriptions}`,
          },
        ],
        tools: [transactionMatchTool],
        tool_choice: {
          type: "function",
          function: { name: "report_transaction_matches" },
        }
      }
    );
    // Extract the function call response
    const toolCall = response.choices[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.type !== "function") {
      throw new Error("Model did not call the expected function");
    }

    // Type guard for function tool call
    const functionCall = toolCall as {
      type: "function";
      function: { name: string; arguments: string };
    };

    if (functionCall.function.name !== "report_transaction_matches") {
      throw new Error("Model called unexpected function");
    }

    const parsed = JSON.parse(functionCall.function.arguments) as {
      matches: Array<{
        pair_index: number;
        is_same_merchant: boolean;
        confidence: "high" | "medium" | "low";
      }>;
    };

    // Map results back to original order
    const resultMap = new Map<number, VerificationResult>();
    for (const match of parsed.matches) {
      resultMap.set(match.pair_index, {
        isSameMerchant: match.is_same_merchant,
        confidence: match.confidence,
      });
    }

    // Return results in original order
    return pairs.map((_, i) => {
      const result = resultMap.get(i + 1);
      if (result) {
        return result;
      }
      // Default if not found
      return {
        isSameMerchant: false,
        confidence: "low" as const,
        reasoning: "No result returned for this pair",
      };
    });
  } catch (error) {
    console.error("LLM verification error:", error);

    // On error, return conservative results (no match, low confidence)
    return pairs.map(() => ({
      isSameMerchant: false,
      confidence: "low" as const,
      reasoning: "Error during LLM verification",
    }));
  }
}

/**
 * Quick check if LLM verification is available (API key configured).
 */
export function isLLMAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
