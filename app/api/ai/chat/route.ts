import { NextResponse } from "next/server";
import { AssistantService } from "@/lib/ai/services/assistantService";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const response = await AssistantService.chat(message);
    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("AI Assistant route error:", error);
    return NextResponse.json({ error: error.message || "Failed to process chat" }, { status: 500 });
  }
}
