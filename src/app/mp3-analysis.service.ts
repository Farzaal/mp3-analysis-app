import { Injectable } from "@nestjs/common";

@Injectable()
export class Mp3AnalysisService {
  /**
   * Analyzes an MP3 file and returns the frame count
   * @param buffer - The MP3 file buffer
   * @returns Object containing frame count
   */
  async analyzeMp3File(buffer: Buffer): Promise<{ frameCount: number }> {
    try {
      const frameCount = this.countMp3Frames(buffer);
      return { frameCount };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to analyze MP3 file: ${errorMessage}`);
    }
  }

  /**
   * Counts MP3 frames by parsing the file structure
   * @param buffer - The MP3 file buffer
   * @returns Number of frames found
   */
  private countMp3Frames(buffer: Buffer): number {
    let frameCount = 0;
    let offset = 0;

    // Skip ID3v2 tag if present
    if (this.hasId3v2Tag(buffer)) {
      offset = this.getId3v2Size(buffer);
    }

    // Parse MP3 frames with better boundary checking
    while (offset < buffer.length - 4) {
      const frameHeader = this.parseFrameHeader(buffer, offset);

      if (frameHeader && frameHeader.isValid && frameHeader.frameSize > 0) {
        // Ensure we don't go beyond buffer bounds
        if (offset + frameHeader.frameSize > buffer.length) {
          // This frame would extend beyond the buffer, so it's incomplete
          break;
        }

        frameCount++;
        offset += frameHeader.frameSize;
      } else {
        // Try to find next valid frame header
        offset++;
      }
    }

    return frameCount;
  }

  /**
   * Checks if the file has an ID3v2 tag
   */
  private hasId3v2Tag(buffer: Buffer): boolean {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0x49 && // 'I'
      buffer[1] === 0x44 && // 'D'
      buffer[2] === 0x33 // '3'
    );
  }

  /**
   * Gets the size of ID3v2 tag
   */
  private getId3v2Size(buffer: Buffer): number {
    if (buffer.length < 10) return 0;

    // ID3v2 size is stored in 4 bytes (big-endian) starting at offset 6
    const size =
      (buffer[6] << 21) | (buffer[7] << 14) | (buffer[8] << 7) | buffer[9];

    return 10 + size; // 10 bytes header + data size
  }

  /**
   * Parses MP3 frame header
   */
  private parseFrameHeader(
    buffer: Buffer,
    offset: number,
  ): { isValid: boolean; frameSize: number } | null {
    if (offset + 4 > buffer.length) return null;

    // Check for MPEG sync word (11 bits set to 1)
    const firstByte = buffer[offset];
    const secondByte = buffer[offset + 1];

    if ((firstByte & 0xff) !== 0xff || (secondByte & 0xe0) !== 0xe0) {
      return null;
    }

    // Parse MPEG version and layer
    const version = (secondByte >> 3) & 0x03;
    const layer = (secondByte >> 1) & 0x03;

    // We only support MPEG Version 1, Layer 3
    if (version !== 0x03 || layer !== 0x01) {
      return null;
    }

    // Parse bitrate and sample rate
    const bitrateIndex = (buffer[offset + 2] >> 4) & 0x0f;
    const sampleRateIndex = (buffer[offset + 2] >> 2) & 0x03;
    const padding = (buffer[offset + 2] >> 1) & 0x01;

    // Calculate frame size
    const frameSize = this.calculateFrameSize(
      bitrateIndex,
      sampleRateIndex,
      padding,
    );

    // Additional validation: ensure frame size is reasonable
    if (frameSize <= 0 || frameSize > 10000) {
      return null; // Invalid frame size
    }

    // Check if we have enough data for the complete frame
    if (offset + frameSize > buffer.length) {
      return null; // Incomplete frame
    }

    return {
      isValid: true,
      frameSize: frameSize,
    };
  }

  /**
   * Calculates MP3 frame size based on bitrate, sample rate, and padding
   */
  private calculateFrameSize(
    bitrateIndex: number,
    sampleRateIndex: number,
    padding: number,
  ): number {
    // MPEG Version 1, Layer 3 bitrates (kbps)
    const bitrates = [
      0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 288, 320,
    ];
    // MPEG Version 1 sample rates (Hz)
    const sampleRates = [44100, 48000, 32000];

    if (bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
      return 0; // Invalid
    }

    const bitrate = bitrates[bitrateIndex];
    const sampleRate = sampleRates[sampleRateIndex];

    // Frame size calculation: (144 * bitrate) / sampleRate + padding
    const frameSize = Math.floor((144 * bitrate * 1000) / sampleRate) + padding;

    return frameSize;
  }
}
