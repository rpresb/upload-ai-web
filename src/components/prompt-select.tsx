import { api } from "@/lib/axios";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Prompt {
  id: string;
  title: string;
  template: string;
}

export function PromptSelect({
  onPromptSelected,
}: {
  onPromptSelected: (template: string) => void;
}) {
  const [prompts, setPrompts] = useState<Prompt[] | null>(null);

  useEffect(() => {
    api.get("/prompts").then(({ data }) => setPrompts(data));
  }, []);

  function handlePromptSelected(promptId: string) {
    const selectedPrompt = prompts?.find((p) => p.id === promptId);
    if (!selectedPrompt) {
      return;
    }
    onPromptSelected(selectedPrompt?.template);
  }

  return (
    <Select onValueChange={handlePromptSelected}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um prompt"></SelectValue>
      </SelectTrigger>

      <SelectContent>
        {prompts?.map((prompt) => (
          <SelectItem key={prompt.id} value={prompt.id}>
            {prompt.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
