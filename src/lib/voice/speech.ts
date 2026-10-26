/**
 * Web Speech API wrapper for the reminder-drop feature.
 *
 * Client-only.
 *
 * Edge cases: Firefox has no support (use Whisper fallback). Safari
 * desktop is intermittent. Safari iOS needs a user gesture to start.
 *
 * The fallback path (record + Whisper) is sketched here as TODO; the
 * primary path is the browser's free, on-device speech recognizer.
 */

declare global {
  interface Window {
    webkitSpeechRecognition?: typeof SpeechRecognition;
    SpeechRecognition?: typeof SpeechRecognition;
  }
}

export interface SpeechSession {
  start(): void;
  stop(): void;
  abort(): void;
  onInterim(cb: (text: string) => void): void;
  onFinal(cb: (text: string) => void): void;
  onError(cb: (msg: string) => void): void;
}

export function speechSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createSpeechSession(opts: { lang?: string } = {}): SpeechSession | null {
  if (!speechSupported()) return null;

  const SR =
    (window.SpeechRecognition ?? window.webkitSpeechRecognition) as
      | { new (): SpeechRecognition }
      | undefined;
  if (!SR) return null;

  const rec = new SR();
  rec.lang = opts.lang ?? "en-US";
  rec.continuous = false;
  rec.interimResults = true;

  let interimCb: ((t: string) => void) | null = null;
  let finalCb: ((t: string) => void) | null = null;
  let errorCb: ((msg: string) => void) | null = null;

  rec.onresult = (e: SpeechRecognitionEvent) => {
    let interim = "";
    let finalText = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const result = e.results[i];
      if (result.isFinal) finalText += result[0].transcript;
      else interim += result[0].transcript;
    }
    if (interim && interimCb) interimCb(interim);
    if (finalText && finalCb) finalCb(finalText.trim());
  };
  rec.onerror = (e: SpeechRecognitionErrorEvent) => {
    errorCb?.(e.error || "speech recognition error");
  };

  return {
    start: () => rec.start(),
    stop: () => rec.stop(),
    abort: () => rec.abort(),
    onInterim: (cb) => { interimCb = cb; },
    onFinal: (cb) => { finalCb = cb; },
    onError: (cb) => { errorCb = cb; },
  };
}
