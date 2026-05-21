"use client";

export type SuggestedClip = {
  start: number;
  end: number;
  duration: number;
  score: number;
  reason: string;
};

type SuggestClipOptions = {
  targetDuration: number;
  videoDuration?: number;
};

const ENERGY_BUCKET_SECONDS = 0.5;
const MAX_DECODE_BYTES = 250 * 1024 * 1024;
const MAX_DECODE_SECONDS = 20 * 60;
const MAX_SAMPLES_PER_BUCKET = 900;

export async function suggestBestClipFromBlob(
  inputBlob: Blob,
  options: SuggestClipOptions
): Promise<SuggestedClip> {
  const targetDuration = Math.max(5, options.targetDuration);
  const fallbackDuration = Math.max(options.videoDuration ?? targetDuration, targetDuration);

  if (inputBlob.size > MAX_DECODE_BYTES || fallbackDuration > MAX_DECODE_SECONDS) {
    return getFallbackSuggestion(
      fallbackDuration,
      targetDuration,
      "This file is large, so the app skipped full audio decoding to avoid freezing the browser."
    );
  }

  try {
    const audioBuffer = await decodeAudio(inputBlob);
    const duration = Math.max(audioBuffer.duration, fallbackDuration);
    const bucketedEnergy = getBucketedEnergy(audioBuffer);
    const suggestion = findStrongestWindow(bucketedEnergy, targetDuration, duration);

    return {
      ...suggestion,
      reason: "Picked the highest-energy section in the uploaded audio track."
    };
  } catch {
    return getFallbackSuggestion(
      fallbackDuration,
      targetDuration,
      "Audio could not be decoded, so a safe early-middle segment was selected."
    );
  }
}

async function decodeAudio(inputBlob: Blob): Promise<AudioBuffer> {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio API is unavailable.");
  }

  const audioContext = new AudioContextClass();
  const arrayBuffer = await inputBlob.arrayBuffer();

  try {
    return await audioContext.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await audioContext.close().catch(() => undefined);
  }
}

function getBucketedEnergy(audioBuffer: AudioBuffer): number[] {
  const bucketSize = Math.max(1, Math.floor(audioBuffer.sampleRate * ENERGY_BUCKET_SECONDS));
  const bucketCount = Math.max(1, Math.ceil(audioBuffer.length / bucketSize));
  const energies = new Array<number>(bucketCount).fill(0);

  for (let channelIndex = 0; channelIndex < audioBuffer.numberOfChannels; channelIndex += 1) {
    const data = audioBuffer.getChannelData(channelIndex);

    for (let bucketIndex = 0; bucketIndex < bucketCount; bucketIndex += 1) {
      const start = bucketIndex * bucketSize;
      const end = Math.min(start + bucketSize, data.length);
      let sum = 0;
      let sampled = 0;
      const sampleStep = Math.max(1, Math.floor((end - start) / MAX_SAMPLES_PER_BUCKET));

      for (let sampleIndex = start; sampleIndex < end; sampleIndex += sampleStep) {
        sum += data[sampleIndex] * data[sampleIndex];
        sampled += 1;
      }

      const rms = Math.sqrt(sum / Math.max(sampled, 1));
      energies[bucketIndex] += rms / audioBuffer.numberOfChannels;
    }
  }

  return smoothEnergy(energies);
}

function smoothEnergy(energies: number[]): number[] {
  return energies.map((energy, index) => {
    const previous = energies[Math.max(0, index - 1)];
    const next = energies[Math.min(energies.length - 1, index + 1)];
    return previous * 0.25 + energy * 0.5 + next * 0.25;
  });
}

function findStrongestWindow(
  energies: number[],
  targetDuration: number,
  duration: number
): SuggestedClip {
  const windowBuckets = Math.max(1, Math.round(targetDuration / ENERGY_BUCKET_SECONDS));
  let bestStartBucket = 0;
  let bestScore = -Infinity;
  let runningScore = 0;

  for (let index = 0; index < energies.length; index += 1) {
    runningScore += scoreBucket(energies[index]);

    if (index >= windowBuckets) {
      runningScore -= scoreBucket(energies[index - windowBuckets]);
    }

    if (index >= windowBuckets - 1) {
      const startBucket = index - windowBuckets + 1;
      const centerBias = getCenterBias(startBucket, windowBuckets, energies.length);
      const score = runningScore / windowBuckets + centerBias;

      if (score > bestScore) {
        bestScore = score;
        bestStartBucket = startBucket;
      }
    }
  }

  const start = Math.max(0, bestStartBucket * ENERGY_BUCKET_SECONDS);
  const end = Math.min(duration, start + targetDuration);

  return {
    start: roundTime(start),
    end: roundTime(end),
    duration: roundTime(end - start),
    score: Math.round(Math.min(Math.max(bestScore * 100, 0), 100)),
    reason: ""
  };
}

function scoreBucket(energy: number): number {
  if (energy < 0.004) return energy * 0.35;
  return Math.min(Math.sqrt(energy) * 2.2, 1);
}

function getCenterBias(startBucket: number, windowBuckets: number, totalBuckets: number): number {
  const center = startBucket + windowBuckets / 2;
  const normalizedPosition = center / Math.max(totalBuckets, 1);

  if (normalizedPosition < 0.08) return -0.08;
  if (normalizedPosition > 0.92) return -0.08;
  if (normalizedPosition >= 0.18 && normalizedPosition <= 0.65) return 0.06;
  return 0;
}

function roundTime(value: number): number {
  return Math.round(value * 10) / 10;
}

function getFallbackSuggestion(
  fallbackDuration: number,
  targetDuration: number,
  reason: string
): SuggestedClip {
  const start = Math.max(0, Math.floor((fallbackDuration - targetDuration) * 0.35));
  const end = Math.min(fallbackDuration, start + targetDuration);

  return {
    start,
    end,
    duration: roundTime(end - start),
    score: 35,
    reason
  };
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
