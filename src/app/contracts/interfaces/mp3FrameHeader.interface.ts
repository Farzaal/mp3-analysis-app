import { Mp3Layer } from "../enums/mpegLayer.enum";
import { Mp3Version } from "../enums/mpegVersion.enum";

export interface Mp3FrameHeader {
  isValid: boolean;
  frameSize: number;
  version: Mp3Version;
  layer: Mp3Layer;
  bitrateIndex: number;
  sampleRateIndex: number;
  padding: number;
  protection: boolean;
}
