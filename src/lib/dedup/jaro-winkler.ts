/**
 * Jaro-Winkler String Similarity Algorithm
 *
 * Better than Levenshtein for merchant name matching because:
 * 1. Gives higher scores to strings that match from the beginning
 * 2. More tolerant of typos and minor variations
 * 3. Returns 0-1 score (1 = perfect match)
 */

/**
 * Calculate the Jaro similarity between two strings.
 * Returns a value between 0 and 1.
 */
function jaro(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Calculate match window
  const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;

  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matching characters
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaroScore =
    (matches / s1.length +
      matches / s2.length +
      (matches - transpositions / 2) / matches) /
    3;

  return jaroScore;
}

/**
 * Calculate the Jaro-Winkler similarity between two strings.
 * Adds a prefix bonus for strings that match from the beginning.
 *
 * @param s1 First string
 * @param s2 Second string
 * @param scalingFactor How much to weight common prefixes (default 0.1, max 0.25)
 * @returns Similarity score between 0 and 1
 */
export function jaroWinkler(
  s1: string,
  s2: string,
  scalingFactor: number = 0.1
): number {
  // Normalize inputs
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();

  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  const jaroScore = jaro(str1, str2);

  // Calculate common prefix (up to 4 characters)
  let prefixLength = 0;
  const maxPrefix = Math.min(4, Math.min(str1.length, str2.length));

  for (let i = 0; i < maxPrefix; i++) {
    if (str1[i] === str2[i]) {
      prefixLength++;
    } else {
      break;
    }
  }

  // Jaro-Winkler formula
  const winklerScore =
    jaroScore + prefixLength * scalingFactor * (1 - jaroScore);

  return winklerScore;
}

/**
 * Calculate similarity using multiple methods and return the best score.
 * Combines Jaro-Winkler with other techniques for robustness.
 */
export function combinedSimilarity(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();

  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  // Method 1: Jaro-Winkler
  const jwScore = jaroWinkler(str1, str2);

  // Method 2: Containment check
  // If one string contains the other (normalized), that's a strong signal
  const norm1 = str1.replace(/[^a-z0-9]/g, "");
  const norm2 = str2.replace(/[^a-z0-9]/g, "");

  let containmentScore = 0;
  if (norm1.length >= 4 && norm2.length >= 4) {
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      // If the shorter string (>= 5 chars) is fully contained, it's a strong match
      // regardless of how much extra prefix/suffix the longer string has
      // e.g., "mcdonalds" in "doordashmcdonalds" should be a strong match
      const shorterLen = Math.min(norm1.length, norm2.length);
      if (shorterLen >= 5) {
        containmentScore = 0.92; // Strong match - contained significant word
      } else {
        // For shorter contained strings, use ratio-based scoring
        const ratio = shorterLen / Math.max(norm1.length, norm2.length);
        containmentScore = 0.7 + ratio * 0.3;
      }
    }
  }

  // Method 3: Word overlap (for multi-word merchant names)
  const words1 = str1.split(/\s+/).filter((w) => w.length >= 3);
  const words2 = str2.split(/\s+/).filter((w) => w.length >= 3);

  let wordOverlapScore = 0;
  if (words1.length > 0 && words2.length > 0) {
    let matchingWords = 0;
    for (const w1 of words1) {
      for (const w2 of words2) {
        if (jaroWinkler(w1, w2) >= 0.85) {
          matchingWords++;
          break;
        }
      }
    }
    wordOverlapScore =
      matchingWords / Math.max(words1.length, words2.length);
  }

  // Return the best score from all methods
  return Math.max(jwScore, containmentScore, wordOverlapScore);
}

