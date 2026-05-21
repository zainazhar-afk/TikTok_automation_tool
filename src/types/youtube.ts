export type YouTubeChannel = {
  channelId: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  uploadsPlaylistId: string;
};

export type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  durationSeconds: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  viralScore: number;
};

export type ChannelUrlParseResult =
  | {
      type: "channelId";
      value: string;
    }
  | {
      type: "handle";
      value: string;
    };
