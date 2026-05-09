"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && window.navigator.standalone === true)
  );
}

function isAppleMobile() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function StaffInstallButton({ className = "" }: { className?: string }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(() => (typeof window === "undefined" ? false : !isStandalone() && isAppleMobile()));
  const [installed, setInstalled] = useState(() => (typeof window === "undefined" ? false : isStandalone()));

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstalled(true);
      setInstallPrompt(null);
      setShowIosHint(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  }

  if (installed) {
    return (
      <span className={`inline-flex min-h-11 items-center rounded-lg bg-teal-50 px-3 text-sm font-semibold text-teal-800 ${className}`}>
        Installed
      </span>
    );
  }

  if (installPrompt) {
    return (
      <Button type="button" variant="secondary" className={className} onClick={install}>
        Install staff app
      </Button>
    );
  }

  if (showIosHint) {
    return (
      <p className={`rounded-lg bg-white px-3 py-2 text-xs leading-5 text-slate-600 shadow-sm ${className}`}>
        Install: Share, then Add to Home Screen.
      </p>
    );
  }

  return null;
}
