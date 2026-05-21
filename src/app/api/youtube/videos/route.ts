import { NextResponse } from "next/server";
import { getChannelVideos, YouTubeApiError } from "@/lib/youtube";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      channelId?: string;
      uploadsPlaylistId?: string;
    };

    if (!body.channelId || !body.uploadsPlaylistId) {
      return NextResponse.json(
        { error: "Channel id and uploads playlist id are required." },
        { status: 400 }
      );
    }

    const videos = await getChannelVideos({
      channelId: body.channelId,
      uploadsPlaylistId: body.uploadsPlaylistId
    });

    return NextResponse.json({ videos });
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

  return NextResponse.json({ error: "Unable to fetch videos for this channel." }, { status: 500 });
}
