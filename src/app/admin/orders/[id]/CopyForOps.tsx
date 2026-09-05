'use client';

import { useState } from 'react';
import { logCopiedForOps } from '../actions';

// Copies the full order details in a paste-ready format for entry into the
// existing Kanziy Operations App, and records the handoff on the timeline.
export default function CopyForOps({
  orderId,
  text,
}: {
  orderId: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API unavailable — fall back to a prompt.
      window.prompt('Copy the order details below:', text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    logCopiedForOps(orderId).catch(() => {});
  }

  return (
    <button type="button" onClick={handleCopy} className="btn-outline w-full py-2.5 text-xs">
      {copied ? '✓ Copied — paste into Operations App' : 'Copy Order for Operations App'}
    </button>
  );
}
