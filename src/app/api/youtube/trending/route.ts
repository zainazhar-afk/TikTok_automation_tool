import { NextResponse } from "next/server";
import { searchYouTubeShorts, YouTubeApiError } from "@/lib/youtube";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      niche?: string;
      regionCode?: string;
    };

    const videos = await searchYouTubeShorts(
      body.niche ?? "all",
      body.regionCode ?? "US"
    );

    return NextResponse.json({ videos });
  } catch (error) {
    if (error instanceof YouTubeApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Unable to fetch YouTube Shorts." },
      { status: 500 }
    );
  }
}
