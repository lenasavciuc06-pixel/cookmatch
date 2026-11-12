import { describe, expect, it } from 'vitest';

import { parseCookingStep } from './cookingSteps';

describe('cooking instructions', () => {
  it('separates Romanian stage timing, method and visual cue', () => {
    expect(parseCookingStep('[8 min] Călește ceapa la foc mediu.\nAspect: Ceapa este translucidă.')).toEqual({
      durationMinutes: 8, action: 'Călește ceapa la foc mediu.', appearance: 'Ceapa este translucidă.',
    });
  });
  it('supports the English translation and Windows line endings', () => {
    expect(parseCookingStep('[12 min] Simmer gently.\r\nLook for: Small bubbles.')).toEqual({
      durationMinutes: 12, action: 'Simmer gently.', appearance: 'Small bubbles.',
    });
  });
  it('preserves legacy and malformed instructions in full', () => {
    for (const instruction of ['Serve warm.', '[0 min] Stir.\nLook for: Smooth.', '[5 min] Cook without a visual cue.']) {
      expect(parseCookingStep(instruction)).toEqual({ action: instruction });
    }
  });
});
