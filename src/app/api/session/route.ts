import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Allow overriding the realtime model via env for easy rollout/debugging
    const model = process.env.NEXT_PUBLIC_REALTIME_MODEL || process.env.REALTIME_MODEL || "gpt-4o-realtime-preview";
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          voice: "ash",
          modalities: ["text", "audio"],
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
        }),
      }
    );
    // If OpenAI responds with error, surface raw body for easier debugging in the client
    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        {
          error: "Failed to create ephemeral session",
          status: response.status,
          model,
          body: text,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
