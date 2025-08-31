import { Injectable } from "@nestjs/common";
import { Readable } from "stream";

@Injectable()
export class Mp3AnalysisService {
  async analyzeMp3Readable(stream: Readable): Promise<{ frameCount: number }> {
    return new Promise((resolve, reject) => {
      const SLIDE = 4 * 1024; // keep tail to catch headers across chunk boundaries
      let slidingBuffer = Buffer.alloc(0);
      let bytesSeen = 0;
      let id3Skipped = false;
      let lastCountedAbs = -1;
      let frameCount = 0;

      const processChunk = (chunk: Buffer) => {
        slidingBuffer = Buffer.concat([slidingBuffer, chunk]);

        // Drop ID3v2 tag (supports v2.4 footer) once we have enough bytes
        if (!id3Skipped && this.hasId3v2Tag(slidingBuffer)) {
          const tagSize = this.getId3v2Size(slidingBuffer);
          if (slidingBuffer.length >= tagSize) {
            slidingBuffer = slidingBuffer.slice(tagSize);
            id3Skipped = true;
          } else {
            return; // wait for more data
          }
        }

        let local = 0;
        while (local <= slidingBuffer.length - 4) {
          const hdr = this.parseFrameHeader(slidingBuffer, local);
          if (hdr && hdr.isValid && hdr.frameSize > 0) {
            const nextLocal = local + hdr.frameSize;

            // two-header confirmation if possible
            const haveNext = nextLocal + 4 <= slidingBuffer.length;
            const nextHdr = haveNext
              ? this.parseFrameHeader(slidingBuffer, nextLocal)
              : null;

            const absStart =
              bytesSeen - slidingBuffer.length + local + chunk.length;
            if (nextHdr) {
              if (absStart > lastCountedAbs) {
                frameCount++;
                lastCountedAbs = absStart;
              }
              local = nextLocal;
              continue;
            }

            if (nextLocal > slidingBuffer.length - 4) break; // need more data to confirm
            local += 1; // likely false sync
          } else {
            local += 1;
          }
        }

        if (slidingBuffer.length > SLIDE) {
          slidingBuffer = slidingBuffer.slice(-SLIDE);
        }
      };

      stream.on("data", (chunk: Buffer) => {
        processChunk(chunk);
        bytesSeen += chunk.length;
      });

      stream.on("end", () => resolve({ frameCount }));
      stream.on("error", (e) => reject(e));
    });
  }

  private parseFrameHeader(
    buffer: Buffer,
    offset: number,
  ): { isValid: boolean; frameSize: number } | null {
    if (offset + 4 > buffer.length) return null;

    const b1 = buffer[offset];
    const b2 = buffer[offset + 1];
    if ((b1 & 0xff) !== 0xff || (b2 & 0xe0) !== 0xe0) return null;

    const version = (b2 >> 3) & 0x03;
    const layer = (b2 >> 1) & 0x03;
    if (version !== 0x03 || layer !== 0x01) return null; // MPEG-1 Layer III only

    const b3 = buffer[offset + 2];
    const bitrateIndex = (b3 >> 4) & 0x0f;
    const sampleRateIndex = (b3 >> 2) & 0x03;
    const padding = (b3 >> 1) & 0x01;

    if (bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3)
      return null;

    const frameSize = this.calculateFrameSize(
      bitrateIndex,
      sampleRateIndex,
      padding,
    );
    if (frameSize < 20 || frameSize > 10000) return null;

    return { isValid: true, frameSize };
  }

  private calculateFrameSize(
    bitrateIndex: number,
    sampleRateIndex: number,
    padding: number,
  ): number {
    const bitrates = [
      0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 288, 320,
    ];
    const sampleRates = [44100, 48000, 32000];

    const bitrate = bitrates[bitrateIndex] * 1000;
    const sampleRate = sampleRates[sampleRateIndex];

    return Math.floor((144 * bitrate) / sampleRate) + padding;
  }

  private hasId3v2Tag(buffer: Buffer): boolean {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0x49 &&
      buffer[1] === 0x44 &&
      buffer[2] === 0x33
    );
  }

  private getId3v2Size(buffer: Buffer): number {
    if (buffer.length < 10) return 0;
    const flags = buffer[5];
    const size =
      (buffer[6] << 21) | (buffer[7] << 14) | (buffer[8] << 7) | buffer[9];
    const hasFooter = (flags & 0x10) !== 0; // ID3v2.4 footer flag
    return 10 + size + (hasFooter ? 10 : 0);
  }
}
