export function calculateViralScore(input: {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  durationSeconds: number;
}): number {
  const views = Math.max(input.viewCount, 0);
  const likes = Math.max(input.likeCount, 0);
  const comments = Math.max(input.commentCount, 0);
  const duration = Math.max(input.durationSeconds, 0);

  const engagementRate = (likes + comments * 2) / Math.max(views, 1);
  const viewScore = clamp((Math.log10(views + 1) / 7) * 100, 0, 100);
  const engagementScore = clamp(engagementRate * 1200, 0, 100);
  const recencyScore = getRecencyScore(input.publishedAt);
  const durationScore = getDurationScore(duration);

  const finalScore =
    viewScore * 0.35 +
    engagementScore * 0.35 +
    recencyScore * 0.15 +
    durationScore * 0.15;

  return Math.round(clamp(finalScore, 0, 100));
}

function getRecencyScore(publishedAt: string): number {
  const published = new Date(publishedAt).getTime();
  if (!Number.isFinite(published)) return 35;

  const ageDays = Math.max(0, (Date.now() - published) / 86_400_000);

  if (ageDays <= 7) return 100;
  if (ageDays <= 30) return 82;
  if (ageDays <= 90) return 62;
  if (ageDays <= 180) return 45;
  if (ageDays <= 365) return 30;
  return 18;
}

function getDurationScore(durationSeconds: number): number {
  if (durationSeconds >= 60 && durationSeconds <= 20 * 60) return 100;
  if (durationSeconds >= 30 && durationSeconds < 60) return 78;
  if (durationSeconds > 20 * 60 && durationSeconds <= 30 * 60) return 70;
  if (durationSeconds > 30 * 60 && durationSeconds <= 60 * 60) return 42;
  if (durationSeconds > 0 && durationSeconds < 30) return 58;
  return 24;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
