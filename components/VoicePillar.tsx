"use client";

import { Calendar, PhoneMissed, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { canSpeak, silence, speak } from "./speech";
import { useLive } from "./live";

type Chat = { id: string; from: "them" | "us" | "event"; text: string };
type LogLine = { id: string; label: string; detail: string };
type Booking = {
  when: string;
  service: string;
  duration: string;
  calendar: string;
  contact: string;
};

let messageSeq = 0;
function nextId() {
  messageSeq += 1;
  return `m-${messageSeq}`;
}

export function VoicePillar() {
  const live = useLive();
  const [phase, setPhase] = useState<"idle" | "ringing" | "live">("idle");
  const [chats, setChats] = useState<Chat[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [shownLogs, setShownLogs] = useState(0);
  const [latency, setLatency] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [stage, setStage] = useState("Idle");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [speakOn, setSpeakOn] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [voiceNote, setVoiceNote] = useState("");
  const timers = useRef<number[]>([]);
  const speakRef = useRef(false);
  const alive = useRef(true);
  const threadRef = useRef<HTMLDivElement>(null);
  speakRef.current = speakOn;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      timers.current.forEach((id) => window.clearTimeout(id));
      silence();
    };
  }, []);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [chats, phase]);

  function payload() {
    return {
      nicheId: live.niche.id,
      business: live.business,
      city: live.city,
      state: live.state,
    };
  }

  function say(text: string) {
    if (speakRef.current) {
      if (!canSpeak()) {
        setVoiceNote("This browser has no speech synthesis.");
        return;
      }
      speak(text);
    }
  }

  async function simulate() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    silence();
    setError("");
    setBooking(null);
    setChats([]);
    setLogs([]);
    setShownLogs(0);
    setLatency(null);
    setPhase("ringing");
    setStage("Ringing");
    setTags([]);
    setBusy(true);
    const started = performance.now();
    try {
      const response = await fetch("/api/demo/missed-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Webhook failed");
      if (!alive.current) return;
      const elapsed = Math.round(performance.now() - started);
      setLatency(elapsed);
      const contact = data.contact as { name: string; phone: string; tags: string[] };
      const hook = data.webhook as { idempotencyKey: string; contactId: string; status: number };
      const nextLogs: LogLine[] = [
        { id: "l1", label: "inbound.call.missed", detail: contact.phone },
        { id: "l2", label: `webhook ${hook.status}`, detail: `${elapsed} ms round trip` },
        { id: "l3", label: "idempotency", detail: hook.idempotencyKey },
        { id: "l4", label: "ghl.contact.upsert", detail: hook.contactId },
        { id: "l5", label: "sms.delivered", detail: "A2P 10DLC" },
      ];
      setLogs(nextLogs);
      setTags(contact.tags);
      setStage("Speed-to-Lead");
      timers.current.push(
        window.setTimeout(() => {
          if (!alive.current) return;
          setPhase("live");
          setChats([
            { id: nextId(), from: "event", text: "Missed call from Sarah Mendez" },
            { id: nextId(), from: "us", text: data.sms as string },
          ]);
          setBusy(false);
          say(data.spoken as string);
          nextLogs.forEach((_, index) => {
            timers.current.push(window.setTimeout(() => setShownLogs(index + 1), 120 * index));
          });
        }, 420),
      );
    } catch (cause) {
      if (!alive.current) return;
      setBusy(false);
      setPhase("idle");
      setError(cause instanceof Error ? cause.message : "Webhook failed");
    }
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy || phase !== "live") return;
    setDraft("");
    setError("");
    setBusy(true);
    setChats((current) => [...current, { id: nextId(), from: "them", text: message }]);
    try {
      const response = await fetch("/api/demo/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload(), message, booked: Boolean(booking) }),
      });
      const data = await response.json();
      if (!alive.current) return;
      if (!response.ok) throw new Error(data.error || "Reply failed");
      setChats((current) => [...current, { id: nextId(), from: "us", text: data.sms as string }]);
      setTags((current) => Array.from(new Set([...current, ...(data.tags as string[])])));
      setStage(data.stage as string);
      if (data.booking) setBooking(data.booking as Booking);
      say(data.spoken as string);
    } catch (cause) {
      if (alive.current) setError(cause instanceof Error ? cause.message : "Reply failed");
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  const fast = latency !== null && latency < 1200;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,390px)_minmax(0,1fr)]">
      <section className="rounded-[2rem] border border-line bg-black p-3 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-[1.45rem] bg-[#14171e]">
          <header className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-dim">Sarah&apos;s phone</p>
              <p className="text-sm text-mist">{live.smsBrand}</p>
            </div>
            <PhoneMissed className={phase === "ringing" ? "ringing text-gold" : "text-dim"} size={18} />
          </header>
          <div ref={threadRef} aria-live="polite" className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
            {phase === "idle" && (
              <p className="px-2 pt-16 text-center text-sm text-dim">
                Waiting on a missed call to {live.niche.trackingPhone}.
              </p>
            )}
            {phase === "ringing" && (
              <p className="px-2 pt-16 text-center font-serif text-2xl text-gold-2">Incoming… Sarah Mendez</p>
            )}
            {chats.map((chat) =>
              chat.from === "event" ? (
                <p key={chat.id} className="text-center text-[11px] uppercase tracking-wider text-dim">
                  {chat.text}
                </p>
              ) : (
                <p
                  key={chat.id}
                  className={
                    chat.from === "us"
                      ? "max-w-[90%] rounded-2xl rounded-bl-md bg-panel-2 px-3 py-2 text-sm leading-relaxed text-mist"
                      : "ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-gold px-3 py-2 text-sm leading-relaxed text-ink"
                  }
                >
                  {chat.text}
                </p>
              ),
            )}
          </div>
          <div className="space-y-2 border-t border-white/5 p-3">
            <div className="flex flex-wrap gap-1.5">
              {live.niche.objections.map((item) => (
                <button
                  key={item.text}
                  type="button"
                  disabled={phase !== "live" || busy}
                  onClick={() => send(item.text)}
                  className="rounded-full border border-line px-2.5 py-1 text-left text-[11px] text-mist disabled:opacity-40"
                >
                  {item.text}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void send(draft);
              }}
            >
              <input
                aria-label="Prospect reply"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                disabled={phase !== "live" || busy}
                placeholder="Reply as Sarah"
                className="min-w-0 flex-1 rounded-full border border-line bg-ink px-3 py-2 text-sm outline-none placeholder:text-dim focus:border-gold"
              />
              <button
                type="submit"
                disabled={phase !== "live" || busy || !draft.trim()}
                className="rounded-full bg-gold px-3 py-2 text-sm text-ink disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void simulate()}
            disabled={busy}
            className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
          >
            Simulate Missed Prospect Call
          </button>
          <button
            type="button"
            aria-pressed={speakOn}
            onClick={() => {
              const next = !speakOn;
              setSpeakOn(next);
              if (!next) silence();
              if (next && !canSpeak()) setVoiceNote("This browser has no speech synthesis.");
              else setVoiceNote("");
            }}
            className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm"
          >
            {speakOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {speakOn ? "Speaking receptionist" : "Voice playback off"}
          </button>
          {latency !== null && (
            <span className={`font-mono text-xs ${fast ? "text-mint" : "text-coral"}`}>
              Webhook {fast ? "fired" : "returned"} in {latency} ms
            </span>
          )}
        </div>
        {voiceNote && <p className="text-xs text-coral">{voiceNote}</p>}
        {error && <p className="text-sm text-coral">{error}</p>}

        <div className="grid gap-3 lg:grid-cols-2">
          <article className="rounded-3xl border border-line bg-panel/80 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-dim">Webhook tape</p>
            <ol className="mt-3 space-y-2 font-mono text-xs">
              {logs.slice(0, shownLogs).map((line) => (
                <li key={line.id} className="grid grid-cols-[9.5rem_1fr] gap-2">
                  <span className="text-gold">{line.label}</span>
                  <span className="text-mist">{line.detail}</span>
                </li>
              ))}
              {shownLogs === 0 && <li className="text-dim">The missed-call webhook lands here.</li>}
            </ol>
          </article>
          <article className="rounded-3xl border border-line bg-panel/80 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-dim">GoHighLevel contact</p>
            <p className="mt-2 font-serif text-2xl">Sarah Mendez</p>
            <p className="text-sm text-dim">{live.niche.prospectPhone}</p>
            <p className="mt-3 text-xs uppercase tracking-wider text-mint">{stage}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.length === 0 && <span className="text-xs text-dim">No tags yet</span>}
              {tags.map((tag) => (
                <span key={tag} className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-gold-2">
                  {tag}
                </span>
              ))}
            </div>
          </article>
        </div>

        {booking && (
          <article className="flex items-start gap-3 rounded-3xl border border-mint/30 bg-mint/10 p-4">
            <Calendar className="mt-1 text-mint" size={18} />
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-mint">Calendar locked</p>
              <p className="font-serif text-2xl text-gold-2">{booking.when}</p>
              <p className="text-sm">
                {booking.service} · {booking.duration} · {booking.calendar}
              </p>
              <p className="text-sm text-dim">
                {booking.contact} at {live.business}, {live.cityLine}
              </p>
            </div>
          </article>
        )}
        <p className="text-xs text-dim">
          Closing-call simulator. NicheForge writes the SMS and the contact tags in this runtime. It does not dial a live carrier.
        </p>
      </section>
    </div>
  );
}
