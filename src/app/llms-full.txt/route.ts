import { llmsText } from "@/lib/llms";

export function GET() {
  return new Response(llmsText(true), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
