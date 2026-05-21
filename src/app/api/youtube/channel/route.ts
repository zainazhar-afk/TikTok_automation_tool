import { NextResponse } from "next/server";
import { getChannelFromUrl, YouTubeApiError } from "@/lib/youtube";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { channelUrl?: string };

    if (!body.channelUrl) {
      return NextResponse.json({ error: "Enter a YouTube channel URL first." }, { status: 400 });
    }

    const channel = await getChannelFromUrl(body.channelUrl);
    return NextResponse.json(channel);
  } catch (error) {
    return handleRouteError(error);
  }
}

function handleRouteError(error: unknown) {
  if (error instanceof YouTubeApiError) {
    return NextResponse.json({ error: error.message, reason: error.reason }, { status: error.status });
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: "Unable to analyze this channel." }, { status: 500 });
}
