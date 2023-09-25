import { api } from "@/lib/axios";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { FileVideo, Upload } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

type Status =
  | "videoSelected"
  | "converting"
  | "uploading"
  | "generating"
  | "success";

const statusMessages: Partial<Record<Status, string>> = {
  converting: "Convertendo...",
  generating: "Transcrevendo...",
  success: "Sucesso!",
  uploading: "Carregando...",
};

export const VideoInputForm = ({
  onVideoUploaded,
}: {
  onVideoUploaded: (id: string) => void;
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>();

  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.currentTarget;

    if (!files) {
      return;
    }

    setStatus("videoSelected");
    const [selectedFile] = files;
    setVideoFile(selectedFile);
  };

  const convertVideoToAudio = async (video: File) => {
    const ffmpeg = await getFFmpeg();
    await ffmpeg.writeFile("input.mp4", await fetchFile(video));

    ffmpeg.exec([
      "-i",
      "input.mp4",
      "-map",
      "0:a",
      "-b:a",
      "20k",
      "-acodec",
      "libmp3lame",
      "output.mp3",
    ]);

    const data = await ffmpeg.readFile("output.mp3");
    const audioFileBlob = new Blob([data], { type: "audio/mpeg" });
    const audioFile = new File([audioFileBlob], "audio.mp3", {
      type: "audio/mpeg",
    });

    return audioFile;
  };

  const handleUploadVideo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!videoFile) {
      return;
    }

    setStatus("converting");

    const prompt = promptInputRef.current?.value;
    const audioFile = await convertVideoToAudio(videoFile);

    const data = new FormData();
    data.append("file", audioFile);

    setStatus("uploading");
    const response = await api.post("/videos", data);

    const { id: videoId } = response.data.video;

    setStatus("generating");
    await api.post(`/videos/${videoId}/transcription`, {
      prompt,
    });

    setStatus("success");
    onVideoUploaded(videoId);
  };

  const previewURL = useMemo(() => {
    if (!videoFile) {
      return null;
    }

    return URL.createObjectURL(videoFile);
  }, [videoFile]);

  return (
    <form className="space-y-6" onSubmit={handleUploadVideo}>
      <label
        htmlFor="video"
        className="relative border w-full flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/30"
      >
        {previewURL ? (
          <video
            src={previewURL}
            controls={false}
            className="pointer-events-none absolute inset-0 aspect-video"
          />
        ) : (
          <>
            <FileVideo className="w-4 h-4" />
            Carregar vídeo
          </>
        )}
      </label>
      <input
        type="file"
        id="video"
        accept="video/mp4"
        className="sr-only"
        onChange={handleFileSelected}
      />
      <Separator />
      <div className="space-y-2">
        <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>
        <Textarea
          ref={promptInputRef}
          id="transcription_prompt"
          className="min-g-20 leading-relaxed"
          placeholder="Inclua palavras-chave mencionadas no vídeo separadas por vírgula"
          disabled={status !== "videoSelected"}
        />
      </div>

      <Button
        type="submit"
        className="w-full data-[success=true]:bg-emerald-400"
        data-success={status === "success"}
        disabled={status !== "videoSelected"}
      >
        {(status && statusMessages[status]) || (
          <>
            Carregar Vídeo <Upload className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </form>
  );
};
