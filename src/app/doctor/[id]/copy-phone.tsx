"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyPhone({ phone }: { phone: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(phone).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy phone number"
      className="flex items-center gap-1.5 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
