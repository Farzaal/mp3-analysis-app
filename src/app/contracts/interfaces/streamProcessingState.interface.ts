export interface StreamProcessingState {
  slidingBuffer: Buffer;
  bytesSeen: number;
  id3Skipped: boolean;
  lastCountedAbs: number;
  frameCount: number;
}
