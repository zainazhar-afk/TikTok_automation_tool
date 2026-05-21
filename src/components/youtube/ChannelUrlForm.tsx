"use client";

import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";

export function ChannelUrlForm({
  onSubmit,
  isLoading
}: {
  onSubmit: (channelUrl: string) => void;
  isLoading: boolean;
}) {
  const [channelUrl, setChannelUrl] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(channelUrl);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <Input
        value={channelUrl}
        onChange={(event) => setChannelUrl(event.target.value)}
        placeholder="https://www.youtube.com/@channel"
        aria-label="YouTube channel URL"
      />
      <Button type="submit" disabled={isLoading}>
        <Search className="h-4 w-4" />
        {isLoading ? "Fetching" : "Fetch Channel"}
      </Button>
    </form>
  );
}
