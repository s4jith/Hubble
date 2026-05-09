/**
 * SentinelAI Moderation Service
 * Client-side integration with the HF Spaces AI moderation backend.
 *
 * Endpoint: POST /api/v1/analyze/text
 * Base URL:  NEXT_PUBLIC_API_URL (env var)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SentinelRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SentinelModerationResult {
  status: string;
  risk_level: SentinelRiskLevel;
  risk_score: number;
  categories: string[];
  decision: {
    action: string;
  };
}

export interface SentinelModerationResponse {
  /** Content is safe to post */
  allowed: boolean;
  /** Content should be blocked */
  blocked: boolean;
  /** Show confirmation warning before posting */
  needsConfirmation: boolean;
  /** Raw result from the API, null if the call failed */
  result: SentinelModerationResult | null;
  /** Set when the API call itself failed */
  error: string | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://sajith-0701-sentinelai.hf.space';

/**
 * Call the SentinelAI backend to moderate a piece of text.
 *
 * Risk mapping:
 *  LOW    → allowed immediately
 *  MEDIUM → surface a confirmation warning to the user
 *  HIGH   → block the post
 *
 * Fail-open: if the API is unreachable, we allow the post and let the
 * existing server-side moderation handle it.
 */
export async function moderateWithSentinel(
  text: string,
  userId: string
): Promise<SentinelModerationResponse> {
  const requestBody = {
    source_app: 'socialhub',
    text,
    user_id: userId,
  };

  console.log('[SentinelAI] Moderation request:', requestBody);

  try {
    const response = await fetch(`${BASE_URL}/api/v1/analyze/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Moderation API returned HTTP ${response.status}`);
    }

    const result: SentinelModerationResult = await response.json();
    console.log('[SentinelAI] Moderation response:', result);

    return {
      allowed: result.risk_level === 'LOW',
      blocked: result.risk_level === 'HIGH',
      needsConfirmation: result.risk_level === 'MEDIUM',
      result,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown moderation error';
    console.error('[SentinelAI] Moderation API error:', message);

    // Fail-open: surface the error in the UI but do not block the post.
    return {
      allowed: true,
      blocked: false,
      needsConfirmation: false,
      result: null,
      error: message,
    };
  }
}
