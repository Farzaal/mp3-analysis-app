// Bitrate values in kbps for MPEG-1 Layer III
export const MPEG1_LAYER3_BITRATES: readonly number[] = [
  0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 288, 320,
] as const;

// Sample rates in Hz for MPEG-1
export const MPEG1_SAMPLE_RATES: readonly number[] = [
  44100, 48000, 32000,
] as const;

// Constants for validation
export const FRAME_SIZE_MIN: number = 20;
export const FRAME_SIZE_MAX: number = 10000;
export const SLIDING_BUFFER_SIZE: number = 4 * 1024;
