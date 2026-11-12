export interface CookingStep {
  durationMinutes?: number;
  action: string;
  appearance?: string;
}

// The API keeps its string[] contract. Timed catalog instructions use a documented
// human-readable format; older/custom instructions remain visible without parsing.
export function parseCookingStep(instruction: string): CookingStep {
  const match = /^\[(\d+) (?:min|мин)\] ([\s\S]+?)\r?\n(?:Aspect|Look for|Внешний вид): ([\s\S]+)$/.exec(instruction);
  if (!match || Number(match[1]) <= 0) return { action: instruction };
  return { durationMinutes: Number(match[1]), action: match[2], appearance: match[3] };
}
