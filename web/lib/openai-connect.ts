import "server-only";
import { getToken } from "@vercel/connect";

/**
 * Gets the app-scoped OpenAI credential from the Vercel Connect connector.
 * Keep calls to this helper in server routes or server actions; never return
 * the token to the browser.
 */
export async function getCriptolaunchOpenAIToken(): Promise<string> {
  return getToken("openai/criptolaunch", { subject: { type: "app" } });
}
