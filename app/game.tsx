"use client";

import { useEffect, useRef, useState } from "react";

type Puzzle = {
  emoji: string;
  answer: string; // canonical answer (lowercase)
};

const PUZZLES: Puzzle[] = [
  { emoji: "1️⃣🥊👨", answer: "one punch man" },
  { emoji: "👦🍜🍥", answer: "naruto" },
  { emoji: "⚔️😱🏰", answer: "attack on titan" },
  { emoji: "🦸‍♂️🏫🇯🇵", answer: "my hero academia" },
  { emoji: "🐉🥊🌌", answer: "dragon ball" },
  { emoji: "📝💀", answer: "death note" },
  { emoji: "👹🗡️🌸", answer: "demon slayer" },
  { emoji: "⚗️🧑‍🤝‍🧑🔧", answer: "fullmetal alchemist" },
  { emoji: "🌙🪄👧", answer: "sailor moon" },
  { emoji: "🤠🚀🎷", answer: "cowboy bebop" },
  { emoji: "⚔️🩸👻", answer: "bleach" }
];

export default function Game() {
  // shuffle puzzles for each game session
  const [puzzles, setPuzzles] = useState<Puzzle[]>(() => {
    // ensure 'demon slayer' is first, shuffle the rest
    const first = PUZZLES.find((p) => p.answer === 'demon slayer');
    const rest = PUZZLES.filter((p) => p.answer !== 'demon slayer');
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    return first ? [first, ...rest] : [...rest];
  });

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [guessCount, setGuessCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isOver, setIsOver] = useState(false);
  const [lost, setLost] = useState(false);
  const [started, setStarted] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifLoading, setGifLoading] = useState(false);
  const [showingGif, setShowingGif] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  function computeTimeForLevel(levelIndex: number) {
    const initial = 20;
    const decreasePer3 = 5;
    const steps = Math.floor(levelIndex / 3);
    return Math.max(5, initial - steps * decreasePer3);
  }

  useEffect(() => {
    if (isOver) return;
    setTimeLeft(computeTimeForLevel(index));
    setInput("");
  }, [index, isOver]);

  useEffect(() => {
    if (isOver || !started) return;
    if (timeLeft <= 0) {
      setIsOver(true);
      setLost(true);
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, isOver, started]);

  function normalize(s: string) {
    return s.trim().toLowerCase();
  }

  function handleSubmit(e?: React.FormEvent, providedValue?: string) {
    e?.preventDefault();
    if (processing) return;
    if (isOver) {
      // restart on submit if game over
      handleRestart();
      return;
    }

    const value = providedValue ?? input;
    const expected = puzzles[index].answer;

    if (normalize(value) === normalize(expected)) {
      // prevent duplicate handling while we process this correct answer
      setProcessing(true);
      // correct answer: increment correct-guess counter
      setGuessCount((c) => c + 1);
      // correct: clear any lost flag, flash success, move to next
      setLost(false);
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 700);

      // if we have a hardcoded GIF for this anime, use it; otherwise fetch from API
        const GIF_MAP: Record<string, string> = {
          'demon slayer': 'https://media.giphy.com/media/jh7F7XwHTywg85ekdl/giphy.gif',
          'naruto': 'https://media.giphy.com/media/Mscw2tH9hcAne/giphy.gif',
          'sailor moon': 'https://media.giphy.com/media/10IIs7CN98Skw0/giphy.gif',
          'dragon ball': 'https://media.giphy.com/media/ul1omlrGG6kpO/giphy.gif',
          'attack on titan': 'https://media.giphy.com/media/3ohzdR9BDaFTp51opG/giphy.gif',
          'bleach': 'https://media.giphy.com/media/XqrWxZms37M7ALU5Ke/giphy.gif',
          'one punch man': 'https://media.giphy.com/media/jj1xut6ZsokKI/giphy.gif',
        };

        const SOUND_MAP: Record<string, string> = {
          // Map to audio files you said are available in public/audio/
          'demon slayer': '/audio/demon-slayer.mp3',
          'naruto': '/audio/naruto.mp3',
          'sailor moon': '/audio/sailor-moon.mp3',
          'dragon ball': '/audio/dragon-ball.mp3',
          'attack on titan': '/audio/attack-on-titan.mp3',
          'bleach': '/audio/bleach.mp3',
          'one punch man': '/audio/one-punch-man.mp3',
        };

        const mappedGif = GIF_MAP[expected.toLowerCase()];
        const mappedSound = SOUND_MAP[expected.toLowerCase()];

        const scheduleAdvance = (delayMs: number) => {
          setShowingGif(true);
          setTimeout(() => {
            if (index + 1 >= puzzles.length) {
              setIsOver(true);
              setProcessing(false);
              setGifUrl(null);
              setShowingGif(false);
              return;
            }
            setIndex((i) => i + 1);
            setProcessing(false);
            setGifUrl(null);
            setShowingGif(false);
            // focus input for next round
            inputRef.current?.focus();
          }, delayMs);
        };

        if (mappedGif) {
        setGifLoading(true);
        setGifUrl(mappedGif);
        setShowingGif(true);
          // play mapped sound if available and advance when it ends
          if (mappedSound) {
            try {
              const audio = new Audio(mappedSound);
              // when audio ends, advance
              audio.onended = () => {
                scheduleAdvance(0);
              };
              audio.play().catch(() => {
                // fallback to timed advance
                scheduleAdvance(3000);
              });
            } catch (e) {
              scheduleAdvance(3000);
            }
          } else {
            scheduleAdvance(3000);
          }
          setTimeout(() => setGifLoading(false), 300);
        } else {
          (async () => {
            try {
              setGifLoading(true);
              const res = await fetch(`/api/gif?q=${encodeURIComponent(expected)}`);
              if (res.ok) {
                const body = await res.json();
                setGifUrl(body.url || null);
                setShowingGif(true);
                if (mappedSound) {
                  try {
                    const audio = new Audio(mappedSound);
                    audio.onended = () => scheduleAdvance(0);
                    audio.play().catch(() => scheduleAdvance(3000));
                  } catch {
                    scheduleAdvance(3000);
                  }
                } else {
                  scheduleAdvance(3000);
                }
              } else {
                setGifUrl(null);
                if (mappedSound) {
                  try { new Audio(mappedSound).play().catch(() => {}); } catch {}
                }
                scheduleAdvance(700);
              }
            } catch (err) {
              setGifUrl(null);
              if (mappedSound) {
                try { new Audio(mappedSound).play().catch(() => {}); } catch {}
              }
              scheduleAdvance(700);
            } finally {
              setGifLoading(false);
            }
          })();
        }

      // play a short synth chime (safe) and optionally a mapped audio URL
      try {
        const playChime = () => {
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const now = ctx.currentTime;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(660, now);
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.12, now + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
            o.connect(g);
            g.connect(ctx.destination);
            o.start(now);
            o.stop(now + 0.65);
          } catch (e) {}
        };
        playChime();
      } catch (e) {}

      if (index + 1 >= puzzles.length) {
        setIsOver(true);
        setProcessing(false);
        return;
      }

      setTimeout(() => {
        setIndex((i) => i + 1);
        setProcessing(false);
      }, 250);
    }

    // clear input only if we handled a correct answer; otherwise keep value so user sees it's wrong
    if (normalize(value) === normalize(expected)) setInput("");
  }

  function handleRestart() {
    // reshuffle puzzles on restart
    setPuzzles((prev) => {
      const arr = [...PUZZLES];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
    setIndex(0);
    setGuessCount(0);
    setIsOver(false);
    setLost(false);
    setStarted(false);
    setTimeLeft(computeTimeForLevel(0));
    inputRef.current?.focus();
    setGifUrl(null);
  }

  const current = puzzles[index];

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6">
        {/* Answer banner shown when lost */}
        <div style={{ minHeight: 36 }} className="w-full flex items-center justify-center">
          {lost && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-md bg-red-600/95 px-4 py-2 text-white shadow-lg game-pop"
            >
              Time's up — answer: <span className="font-semibold">{current.answer}</span>
            </div>
          )}
        </div>

        {/* emoji is shown only when not displaying gif/audio */}

        {/* Gif preview when available */}
        {/* When a GIF/audio is playing we hide the emoji and input; show only the GIF */}
        {showingGif ? (
          gifLoading ? (
            <div className="mt-2 text-sm text-zinc-500">Loading GIF…</div>
          ) : gifUrl ? (
            <div className="mt-4 w-full flex items-center justify-center">
              <img src={gifUrl} alt="anime gif" className="max-h-48 rounded-md shadow-md" />
            </div>
          ) : null
        ) : (
          <>
            <div
              aria-hidden
              className={`select-none ${successFlash ? 'game-success' : ''}`}
              style={{ fontSize: '6rem', lineHeight: 1 }}
            >
              {current.emoji}
            </div>
            <form onSubmit={handleSubmit} className="w-full">
          <label htmlFor="guess" className="sr-only">Guess</label>
          <input
            id="guess"
            ref={inputRef}
            value={input}
            onChange={(e) => {
                const v = e.target.value;
                if (!started) setStarted(true);
                setInput(v);
                // auto-submit when the typed value exactly matches the answer
                const expected = puzzles[index].answer;
                if (!processing && normalize(v) === normalize(expected)) {
                  setTimeout(() => handleSubmit(), 50);
                }
              }}
            onKeyDown={(e) => {
              // submit on Enter
              if (e.key === 'Enter' && !processing) handleSubmit();
            }}
            placeholder="Type the anime title and press Enter"
            className="w-full rounded-md border border-zinc-200 px-4 py-3 text-center text-lg focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            disabled={isOver}
            autoFocus
            aria-label="Guess the anime"
          />
            </form>

            <div className="text-sm text-zinc-600 dark:text-zinc-300">
              <span className="mr-4">{timeLeft}s</span>
              <span>Guesses: {guessCount}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
