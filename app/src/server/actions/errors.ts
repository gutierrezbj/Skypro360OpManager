export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

export function toActionError(err: unknown, fallback: string): { success: false; error: string } {
  if (err instanceof ActionError) return { success: false, error: err.message };
  console.error(`[action] ${fallback}:`, err);
  return { success: false, error: fallback };
}
