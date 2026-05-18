import { fetchPageSummary, fetchPageExtract } from '../services/wikipedia';
import type { WikiSummary } from '../types/graph';

// Try REST summary first; fall back to action API extract on failure.
// Returns null only if both fail (truly unavailable).
export async function fetchSummaryWithFallback(rawId: string): Promise<WikiSummary | null> {
  const title = rawId.replace(/^Category:/, '');
  try {
    return await fetchPageSummary(title);
  } catch {
    // REST API failed — try the action API extract endpoint
    try {
      return await fetchPageExtract(title);
    } catch {
      return null;
    }
  }
}
