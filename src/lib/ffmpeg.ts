import { FFmpeg } from "@ffmpeg/ffmpeg";
import coreURL from "../ffmpeg/ffmpeg-core.js?url";
import wasmURL from "../ffmpeg/ffmpeg-core.wasm?url";
import workerURL from "../ffmpeg/ffmpeg-core.worker.js?url";

let ffmpeg: FFmpeg | null;

export async function getFFmpeg() {
  if (ffmpeg) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();
  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL,
      wasmURL,
      workerURL,
    });
  }

  //ffmpeg.on("log", console.log);

  ffmpeg.on("progress", ({ progress }) => {
    console.log(`Progress ${progress}`);
  });

  return ffmpeg;
}
