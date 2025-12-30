import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  verifyMatchesBatch,
  isLLMAvailable,
  type TransactionPair,
} from "@/lib/dedup/llm-verifier";
import type { UncertainPair, DuplicateMatch } from "@somar/shared/dedup";

/**
 * POST /api/dedup/verify
 *
 * LLM-only verification endpoint for Tier 2 deduplication.
 * Client must run Tier 1 (deterministic) matching first.
 *
 * Input: Array of uncertain pairs from Tier 1
 * Output: Array of LLM verification results
 */

interface VerifyRequest {
  uncertainPairs: UncertainPair[];
}

interface VerifyResponse {
  success: boolean;
  data?: {
    matches: Array<{
      newTransactionId?: string;
      newTransactionDescription: string;
      candidateId: string;
      confidence: number;
    }>;
    nonMatches: string[];
    stats: {
      totalPairs: number;
      matchesFound: number;
      processingTimeMs: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<VerifyResponse>> {
  // Validate session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      },
      { status: 401 }
    );
  }

  // Check if LLM is configured
  if (!isLLMAvailable()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "LLM_NOT_CONFIGURED",
          message: "LLM verification not available (OPENAI_API_KEY not set)",
        },
      },
      { status: 503 }
    );
  }

  // Parse request body
  let body: VerifyRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_REQUEST", message: "Invalid JSON body" },
      },
      { status: 400 }
    );
  }

  const { uncertainPairs } = body;

  if (!uncertainPairs || !Array.isArray(uncertainPairs)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_PAIRS",
          message: "uncertainPairs array is required",
        },
      },
      { status: 400 }
    );
  }

  // Limit batch size to prevent abuse (client should batch on their side)
  if (uncertainPairs.length > 100) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BATCH_TOO_LARGE",
          message: "Maximum 100 pairs per request. Use chunkArray() to batch.",
        },
      },
      { status: 400 }
    );
  }

  // Empty array is valid - return empty results
  if (uncertainPairs.length === 0) {
    return NextResponse.json({
      success: true,
      data: {
        matches: [],
        nonMatches: [],
        stats: {
          totalPairs: 0,
          matchesFound: 0,
          processingTimeMs: 0,
        },
      },
    });
  }

  try {
    const startTime = Date.now();

    // Convert uncertain pairs to LLM verifier format
    const pairs: TransactionPair[] = uncertainPairs.map((p) => ({
      newDescription: p.newTransaction.description,
      existingDescription: p.candidate.description,
      amount: p.newTransaction.amount,
      date: p.newTransaction.date,
    }));

    // Run LLM verification
    const llmResults = await verifyMatchesBatch(pairs);

    // Process results
    const matches: Array<{
      newTransactionId?: string;
      newTransactionDescription: string;
      candidateId: string;
      confidence: number;
    }> = [];
    const nonMatches: string[] = [];
    const processedNewTxs = new Set<string>();

    for (let i = 0; i < llmResults.length; i++) {
      const result = llmResults[i];
      const pair = uncertainPairs[i];
      const newTxKey =
        pair.newTransaction.id || pair.newTransaction.description;

      // Skip if we already found a match for this new transaction
      if (processedNewTxs.has(newTxKey)) {
        continue;
      }

      if (result.isSameMerchant && result.confidence !== "low") {
        // LLM confirmed match
        matches.push({
          newTransactionId: pair.newTransaction.id,
          newTransactionDescription: pair.newTransaction.description,
          candidateId: pair.candidate.id!,
          confidence:
            result.confidence === "high"
              ? 0.95
              : result.confidence === "medium"
                ? 0.85
                : 0.75,
        });
        processedNewTxs.add(newTxKey);
      }
    }

    // Find non-matches (new transactions that didn't match any candidate)
    const matchedDescriptions = new Set(matches.map((m) => m.newTransactionDescription));
    const seenNewTxs = new Set<string>();
    for (const pair of uncertainPairs) {
      const desc = pair.newTransaction.description;
      if (!matchedDescriptions.has(desc) && !seenNewTxs.has(desc)) {
        nonMatches.push(desc);
        seenNewTxs.add(desc);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        matches,
        nonMatches,
        stats: {
          totalPairs: uncertainPairs.length,
          matchesFound: matches.length,
          processingTimeMs: Date.now() - startTime,
        },
      },
    });
  } catch (error: unknown) {
    console.error("[Dedup Verify] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VERIFY_FAILED",
          message: "Failed to run LLM verification",
        },
      },
      { status: 500 }
    );
  }
}
