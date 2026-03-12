function extractErrorMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "";
}

export function friendlyAiErrorMessage(error: unknown): string {
  const raw = extractErrorMessage(error).trim();
  const normalized = raw.toLowerCase();

  if (!raw) {
    return "Unable to complete your request right now. Please try again.";
  }

  if (
    normalized.includes("08s01") ||
    normalized.includes("communication link failure") ||
    normalized.includes("tcp provider") ||
    normalized.includes("(10060)")
  ) {
    return "Unable to reach the database right now. Please try again shortly.";
  }

  if (
    normalized.includes("timeout") ||
    normalized.includes("timed out") ||
    normalized.includes("task was canceled")
  ) {
    return "This request took too long. Try a narrower question and run it again.";
  }

  if (normalized.includes("cannot connect to ai service")) {
    return "AI service is currently unavailable. Please try again in a moment.";
  }

  if (normalized.includes("object of type date is not json serializable")) {
    return "The AI response included an unsupported data format. Please try again.";
  }

  if (normalized.includes("text cannot be empty")) {
    return "Please enter a message before sending.";
  }

  if (normalized.startsWith("ai service error:")) {
    return "AI service could not complete this request. Please try again.";
  }

  return "Something went wrong while generating a response. Please try again.";
}

