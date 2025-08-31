import { Injectable } from "@nestjs/common";
import { Readable } from "stream";
import { BunyanLogger } from "./commons/logger.service";
import { Mp3FrameHeader } from "./contracts/interfaces/mp3FrameHeader.interface";
import { Id3v2Tag } from "./contracts/interfaces/id3v2Tag.interface";
import { StreamProcessingState } from "./contracts/interfaces/streamProcessingState.interface";
import { Mp3Version } from "./contracts/enums/mpegVersion.enum";
import { Mp3Layer } from "./contracts/enums/mpegLayer.enum";
import {
  MPEG1_LAYER3_BITRATES,
  MPEG1_SAMPLE_RATES,
  FRAME_SIZE_MIN,
  FRAME_SIZE_MAX,
  SLIDING_BUFFER_SIZE,
} from "./constants/mp3.constants";

@Injectable()
export class Mp3AnalysisService {
  constructor(private readonly logger: BunyanLogger) {}

  /**
   * Analyzes an MP3 file stream and returns the frame count
   * @param stream - The MP3 file as a Readable stream
   * @returns Promise resolving to object containing frame count
   */
  async analyzeMp3Readable(stream: Readable): Promise<{ frameCount: number }> {
    this.logger.log("Starting MP3 stream analysis");

    return new Promise<{ frameCount: number }>((resolve, reject) => {
      const initialState: StreamProcessingState = {
        slidingBuffer: Buffer.alloc(0),
        bytesSeen: 0,
        id3Skipped: false,
        lastCountedAbs: -1,
        frameCount: 0,
      };

      this.logger.log(
        `Initialized stream processing state with ${SLIDING_BUFFER_SIZE}KB sliding buffer`,
      );

      stream.on("data", (chunk: Buffer): void => {
        try {
          this.logger.debug(
            `Stream data event: chunk size ${chunk.length} bytes`,
          );
          this.processChunk(chunk, initialState);
          initialState.bytesSeen += chunk.length;
          this.logger.debug(`Total bytes processed: ${initialState.bytesSeen}`);
        } catch (error) {
          this.logger.error(
            `Error processing stream chunk: ${error instanceof Error ? error.message : "Unknown error"}`,
            error,
          );
          // Reject the promise to propagate error to UI
          reject(error);
        }
      });

      stream.on("end", (): void => {
        this.logger.log(
          `Stream ended. Final analysis results: ${initialState.frameCount} frames found from ${initialState.bytesSeen} total bytes`,
        );
        resolve({ frameCount: initialState.frameCount });
      });

      stream.on("error", (error: Error): void => {
        this.logger.error(`Stream error occurred: ${error.message}`, error);
        reject(error);
      });
    });
  }

  /**
   * Processes a chunk of MP3 data and updates the processing state
   * @param chunk - Buffer chunk from the stream
   * @param state - Current processing state to update
   */
  private processChunk(chunk: Buffer, state: StreamProcessingState): void {
    try {
      this.logger.debug(`Processing chunk of size: ${chunk.length} bytes`);

      state.slidingBuffer = Buffer.concat([state.slidingBuffer, chunk]);

      this.logger.debug(
        `Sliding buffer size after chunk: ${state.slidingBuffer.length} bytes`,
      );

      // Drop ID3v2 tag (supports v2.4 footer) once we have enough bytes
      if (!state.id3Skipped && this.hasId3v2Tag(state.slidingBuffer)) {
        this.logger.log("ID3v2 tag detected, processing tag information");

        const tagInfo: Id3v2Tag = this.getId3v2TagInfo(state.slidingBuffer);

        this.logger.log(
          `ID3v2 tag size: ${tagInfo.size} bytes, has footer: ${tagInfo.hasFooter}, total: ${tagInfo.totalSize} bytes`,
        );

        if (state.slidingBuffer.length >= tagInfo.totalSize) {
          state.slidingBuffer = state.slidingBuffer.slice(tagInfo.totalSize);
          state.id3Skipped = true;
          this.logger.log(
            `ID3v2 tag skipped, remaining buffer: ${state.slidingBuffer.length} bytes`,
          );
        } else {
          this.logger.debug(
            `Waiting for more data to complete ID3v2 tag (need ${tagInfo.totalSize - state.slidingBuffer.length} more bytes)`,
          );
          return; // wait for more data
        }
      }

      let local: number = 0;
      let framesFoundInChunk = 0;

      while (local <= state.slidingBuffer.length - 4) {
        const frameHeader: Mp3FrameHeader | null = this.parseFrameHeader(
          state.slidingBuffer,
          local,
        );

        if (frameHeader && frameHeader.isValid && frameHeader.frameSize > 0) {
          this.logger.debug(
            `Valid frame header found at local offset ${local}, size: ${frameHeader.frameSize} bytes, version: MPEG-${frameHeader.version}, layer: ${frameHeader.layer}`,
          );

          const nextLocal: number = local + frameHeader.frameSize;

          // two-header confirmation if possible
          const haveNext: boolean = nextLocal + 4 <= state.slidingBuffer.length;
          const nextHeader: Mp3FrameHeader | null = haveNext
            ? this.parseFrameHeader(state.slidingBuffer, nextLocal)
            : null;

          const absStart: number =
            state.bytesSeen - state.slidingBuffer.length + local + chunk.length;

          if (nextHeader) {
            this.logger.debug(
              `Next frame confirmed at offset ${nextLocal}, confirming current frame at absolute position ${absStart}`,
            );

            if (absStart > state.lastCountedAbs) {
              state.frameCount++;
              state.lastCountedAbs = absStart;
              framesFoundInChunk++;

              this.logger.debug(
                `Frame ${state.frameCount} counted at absolute position ${absStart}`,
              );
            } else {
              this.logger.debug(
                `Frame at position ${absStart} already counted, skipping`,
              );
            }
            local = nextLocal;
            continue;
          }

          if (nextLocal > state.slidingBuffer.length - 4) {
            this.logger.debug(
              `Next frame would extend beyond buffer (${nextLocal} > ${state.slidingBuffer.length - 4}), waiting for more data`,
            );
            break; // need more data to confirm
          }

          this.logger.debug(
            `Likely false sync at offset ${local}, advancing by 1 byte`,
          );
          local += 1; // likely false sync
        } else {
          local += 1;
        }
      }

      if (framesFoundInChunk > 0) {
        this.logger.log(
          `Found ${framesFoundInChunk} frames in current chunk, total frames: ${state.frameCount}`,
        );
      }

      if (state.slidingBuffer.length > SLIDING_BUFFER_SIZE) {
        const bytesToRemove = state.slidingBuffer.length - SLIDING_BUFFER_SIZE;
        this.logger.debug(
          `Trimming sliding buffer by ${bytesToRemove} bytes to maintain ${SLIDING_BUFFER_SIZE}KB limit`,
        );

        state.slidingBuffer = state.slidingBuffer.slice(-SLIDING_BUFFER_SIZE);
      }
    } catch (error) {
      this.logger.error(
        `Error processing chunk: ${error instanceof Error ? error.message : "Unknown error"}`,
        error,
      );
      // Re-throw the error so it can be caught by the stream error handler
      throw error;
    }
  }

  /**
   * Parses and validates an MP3 frame header
   * @param buffer - Buffer containing the frame data
   * @param offset - Offset within the buffer to start parsing
   * @returns Parsed frame header or null if invalid
   */
  private parseFrameHeader(
    buffer: Buffer,
    offset: number,
  ): Mp3FrameHeader | null {
    if (offset + 4 > buffer.length) {
      this.logger.debug(
        `Insufficient buffer data at offset ${offset}, need 4 bytes, have ${buffer.length - offset}`,
      );
      return null;
    }

    const b1: number = buffer[offset];
    const b2: number = buffer[offset + 1];

    if ((b1 & 0xff) !== 0xff || (b2 & 0xe0) !== 0xe0) {
      this.logger.debug(
        `Invalid sync word at offset ${offset}: 0x${b1.toString(16).padStart(2, "0")} 0x${b2.toString(16).padStart(2, "0")}`,
      );
      return null;
    }

    const version: Mp3Version = (b2 >> 3) & 0x03;
    const layer: Mp3Layer = (b2 >> 1) & 0x03;

    if (version !== Mp3Version.MPEG_1 || layer !== Mp3Layer.LAYER_3) {
      this.logger.debug(
        `Unsupported MPEG version/layer at offset ${offset}: version=${version}, layer=${layer}`,
      );
      return null; // MPEG-1 Layer III only
    }

    const b3: number = buffer[offset + 2];
    const bitrateIndex: number = (b3 >> 4) & 0x0f;
    const sampleRateIndex: number = (b3 >> 2) & 0x03;
    const padding: number = (b3 >> 1) & 0x01;
    const protection: boolean = (b3 & 0x01) === 0;

    if (bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
      this.logger.debug(
        `Invalid bitrate/sample rate indices at offset ${offset}: bitrate=${bitrateIndex}, sampleRate=${sampleRateIndex}`,
      );
      return null;
    }

    const frameSize: number = this.calculateFrameSize(
      bitrateIndex,
      sampleRateIndex,
      padding,
    );

    if (frameSize < FRAME_SIZE_MIN || frameSize > FRAME_SIZE_MAX) {
      this.logger.debug(
        `Invalid frame size ${frameSize} at offset ${offset} (must be between ${FRAME_SIZE_MIN}-${FRAME_SIZE_MAX})`,
      );
      return null;
    }

    this.logger.debug(
      `Valid frame header at offset ${offset}: size=${frameSize}, bitrate=${MPEG1_LAYER3_BITRATES[bitrateIndex]}kbps, sampleRate=${MPEG1_SAMPLE_RATES[sampleRateIndex]}Hz, padding=${padding}, protection=${protection}`,
    );

    return {
      isValid: true,
      frameSize,
      version,
      layer,
      bitrateIndex,
      sampleRateIndex,
      padding,
      protection,
    };
  }

  /**
   * Calculates MP3 frame size based on bitrate, sample rate, and padding
   * @param bitrateIndex - Index into the bitrate table
   * @param sampleRateIndex - Index into the sample rate table
   * @param padding - Padding bit (0 or 1)
   * @returns Calculated frame size in bytes
   */
  private calculateFrameSize(
    bitrateIndex: number,
    sampleRateIndex: number,
    padding: number,
  ): number {
    const bitrate: number = MPEG1_LAYER3_BITRATES[bitrateIndex] * 1000;
    const sampleRate: number = MPEG1_SAMPLE_RATES[sampleRateIndex];

    const calculatedSize = Math.floor((144 * bitrate) / sampleRate) + padding;

    this.logger.debug(
      `Frame size calculation: (144 * ${bitrate}) / ${sampleRate} + ${padding} = ${calculatedSize} bytes`,
    );

    return calculatedSize;
  }

  /**
   * Checks if the buffer starts with an ID3v2 tag
   * @param buffer - Buffer to check
   * @returns True if ID3v2 tag is detected
   */
  private hasId3v2Tag(buffer: Buffer): boolean {
    const hasTag =
      buffer.length >= 3 &&
      buffer[0] === 0x49 && // 'I'
      buffer[1] === 0x44 && // 'D'
      buffer[2] === 0x33; // '3'

    if (hasTag) {
      this.logger.debug(
        `ID3v2 tag signature detected: ${String.fromCharCode(buffer[0], buffer[1], buffer[2])}`,
      );
    }

    return hasTag;
  }

  /**
   * Extracts ID3v2 tag information including size and footer presence
   * @param buffer - Buffer containing the ID3v2 tag
   * @returns ID3v2 tag information object
   */
  private getId3v2TagInfo(buffer: Buffer): Id3v2Tag {
    if (buffer.length < 10) {
      this.logger.debug(
        `Insufficient buffer for ID3v2 header parsing: ${buffer.length} < 10 bytes`,
      );
      return {
        hasTag: false,
        size: 0,
        hasFooter: false,
        totalSize: 0,
      };
    }

    const flags: number = buffer[5];
    const size: number =
      (buffer[6] << 21) | (buffer[7] << 14) | (buffer[8] << 7) | buffer[9];
    const hasFooter: boolean = (flags & 0x10) !== 0; // ID3v2.4 footer flag
    const totalSize: number = 10 + size + (hasFooter ? 10 : 0);

    this.logger.debug(
      `ID3v2 header parsed: data size=${size} bytes, has footer=${hasFooter}, total size=${totalSize} bytes`,
    );

    return {
      hasTag: true,
      size,
      hasFooter,
      totalSize,
    };
  }
}
