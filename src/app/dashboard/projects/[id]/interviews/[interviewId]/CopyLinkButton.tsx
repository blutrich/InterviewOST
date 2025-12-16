"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  link: string;
}

export default function CopyLinkButton({ link }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" onClick={handleCopy}>
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}
