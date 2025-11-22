"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Card, CardBody, Input, Button, Progress, Chip } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";

type Puzzle = {
  emoji: string;
  answer: string; // canonical answer (lowercase)
};

// =============================================================================
// PUZZLES WITH SOUND + GIF (have both audio file and gif configured)
// =============================================================================
const PUZZLES_WITH_MEDIA: Puzzle[] = [
  { emoji: "👹🗡️🌸", answer: "demon slayer" },
  { emoji: "👦🍜🍥", answer: "naruto" },
  { emoji: "🌙🪄👧", answer: "sailor moon" },
  { emoji: "🐉🥊🌌", answer: "dragon ball" },
  { emoji: "⚔️😱🏰", answer: "attack on titan" },
  { emoji: "⚔️🩸👻", answer: "bleach" },
  { emoji: "1️⃣🥊👨", answer: "one punch man" },
];

// =============================================================================
// PUZZLES WITHOUT MEDIA (no sound/gif - add more here!)
// Uncomment in PUZZLES array below when assets are ready
// =============================================================================
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PUZZLES_NO_MEDIA: Puzzle[] = [
  { emoji: "🦸‍♂️🏫🇯🇵", answer: "my hero academia" },
  { emoji: "📝💀", answer: "death note" },
  { emoji: "⚗️🧑‍🤝‍🧑🔧", answer: "fullmetal alchemist" },
  { emoji: "🤠🚀🎷", answer: "cowboy bebop" },
  { emoji: "👻🔫🍬", answer: "jujutsu kaisen" },
  { emoji: "🏴‍☠️👒🗺️", answer: "one piece" },
  { emoji: "🎾👑", answer: "prince of tennis" },
  { emoji: "🏀🌈", answer: "kuroko no basket" },
  { emoji: "🏐🦅🗑️", answer: "haikyuu" },
  { emoji: "👊💥🏋️", answer: "baki" },
  { emoji: "🧬👁️🔬", answer: "parasyte" },
  { emoji: "🎹👦🎻", answer: "your lie in april" },
  { emoji: "🐺🌾🍎", answer: "spice and wolf" },
  { emoji: "👧🔮📚", answer: "little witch academia" },
  { emoji: "🤖👦🌍", answer: "astro boy" },
  { emoji: "🔫🧥🕵️", answer: "psycho pass" },
  { emoji: "🎮🏰⚔️", answer: "sword art online" },
  { emoji: "👁️🔴☁️", answer: "neon genesis evangelion" },
  { emoji: "🍀📖✨", answer: "black clover" },
  { emoji: "🔥👊🚒", answer: "fire force" },
  { emoji: "🧟‍♂️🏫🚌", answer: "high school of the dead" },
  { emoji: "🦊👦🍃", answer: "inuyasha" },
  { emoji: "🎭🃏🕴️", answer: "jojos bizarre adventure" },
  { emoji: "👻💀☠️", answer: "soul eater" },
  { emoji: "🐱🧺🍙", answer: "fruits basket" },
  { emoji: "⛩️👹🗡️", answer: "dororo" },
  { emoji: "🏃‍♂️🧟💨", answer: "tokyo ghoul" },
  { emoji: "🎲♟️🧠", answer: "no game no life" },
  { emoji: "🌸👘🗡️", answer: "rurouni kenshin" },
  { emoji: "🔮👧⏰", answer: "steins gate" },
];

// Combined puzzles - only using PUZZLES_WITH_MEDIA for now until other assets are uploaded
const PUZZLES: Puzzle[] = [...PUZZLES_WITH_MEDIA];

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Game() {
  // Start with unshuffled puzzles to avoid hydration mismatch
  const [puzzles, setPuzzles] = useState<Puzzle[]>(PUZZLES);
  const shuffledRef = useRef(false);

  // Shuffle on client side only after mount
  useEffect(() => {
    if (!shuffledRef.current) {
      shuffledRef.current = true;
      const id = setTimeout(() => {
        setPuzzles(shuffleArray(PUZZLES));
      }, 0);
      return () => clearTimeout(id);
    }
  }, []);

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
  const [volume, setVolume] = useState(0.3);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const submittingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Update audio volume when slider changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  function computeTimeForLevel(levelIndex: number) {
    const initial = 20;
    const decreasePer3 = 5;
    const steps = Math.floor(levelIndex / 3);
    return Math.max(5, initial - steps * decreasePer3);
  }

  const levelTime = computeTimeForLevel(index);
  useEffect(() => {
    if (isOver) return;
    const newTime = levelTime;
    const timerId = setTimeout(() => {
      setTimeLeft(newTime);
      setInput("");
    }, 0);
    return () => clearTimeout(timerId);
  }, [index, isOver, levelTime]);

  useEffect(() => {
    if (isOver || !started || showingGif) return;
    if (timeLeft <= 0) {
      const timeoutId = setTimeout(() => {
        setIsOver(true);
        setLost(true);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, isOver, started, showingGif]);

  function normalize(s: string) {
    return s.trim().toLowerCase();
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (processing || submittingRef.current) return;
    if (isOver) {
      handleRestart();
      return;
    }

    const value = input;
    const expected = puzzles[index].answer;

    if (normalize(value) === normalize(expected)) {
      submittingRef.current = true;
      setProcessing(true);
      setGuessCount((c) => c + 1);
      setLost(false);
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 700);

      const GIF_MAP: Record<string, string> = {
        "demon slayer":
          "https://media.giphy.com/media/jh7F7XwHTywg85ekdl/giphy.gif",
        naruto: "https://media.giphy.com/media/Mscw2tH9hcAne/giphy.gif",
        "sailor moon":
          "https://media.giphy.com/media/10IIs7CN98Skw0/giphy.gif",
        "dragon ball":
          "https://media.giphy.com/media/ul1omlrGG6kpO/giphy.gif",
        "attack on titan":
          "https://media.giphy.com/media/3ohzdR9BDaFTp51opG/giphy.gif",
        bleach: "https://media.giphy.com/media/XqrWxZms37M7ALU5Ke/giphy.gif",
        "one punch man":
          "https://media.giphy.com/media/jj1xut6ZsokKI/giphy.gif",
      };

      const basePath =
        process.env.NODE_ENV === "production" ? "/guesstheemoji" : "";
      const SOUND_MAP: Record<string, string> = {
        "demon slayer": `${basePath}/audio/demon-slayer.mp3`,
        naruto: `${basePath}/audio/naruto.mp3`,
        "sailor moon": `${basePath}/audio/sailor-moon.mp3`,
        "dragon ball": `${basePath}/audio/dragon-ball.mp3`,
        "attack on titan": `${basePath}/audio/attack-on-titan.mp3`,
        bleach: `${basePath}/audio/bleach.mp3`,
        "one punch man": `${basePath}/audio/one-punch-man.mp3`,
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
            submittingRef.current = false;
            return;
          }
          setIndex((i) => i + 1);
          setProcessing(false);
          setGifUrl(null);
          setShowingGif(false);
          submittingRef.current = false;
          inputRef.current?.focus();
        }, delayMs);
      };

      if (mappedGif) {
        setGifLoading(true);
        setGifUrl(mappedGif);
        setShowingGif(true);
        if (mappedSound) {
          try {
            const audio = new Audio(mappedSound);
            audio.volume = volume;
            audioRef.current = audio;
            audio.onended = () => {
              audioRef.current = null;
              scheduleAdvance(0);
            };
            audio.play().catch(() => {
              audioRef.current = null;
              scheduleAdvance(3000);
            });
          } catch {
            scheduleAdvance(3000);
          }
        } else {
          scheduleAdvance(3000);
        }
        setTimeout(() => setGifLoading(false), 300);
      } else {
        setGifUrl(null);
        if (mappedSound) {
          try {
            const audio = new Audio(mappedSound);
            audio.volume = volume;
            audioRef.current = audio;
            audio.onended = () => {
              audioRef.current = null;
              scheduleAdvance(0);
            };
            audio.play().catch(() => {
              audioRef.current = null;
              scheduleAdvance(3000);
            });
          } catch {
            scheduleAdvance(3000);
          }
        } else {
          scheduleAdvance(3000);
        }
      }

      // Play a short chime sound
      try {
        const ctx = new (window.AudioContext ||
          (
            window as unknown as {
              webkitAudioContext: typeof AudioContext;
            }
          ).webkitAudioContext)();
        const now = ctx.currentTime;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(660, now);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.12 * volume, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now);
        o.stop(now + 0.65);
      } catch {
        // Ignore audio context errors
      }

      setInput("");
    }
  }

  function handleRestart() {
    setPuzzles(shuffleArray(PUZZLES));
    setIndex(0);
    setGuessCount(0);
    setIsOver(false);
    setLost(false);
    setStarted(false);
    setTimeLeft(computeTimeForLevel(0));
    setProcessing(false);
    submittingRef.current = false;
    inputRef.current?.focus();
    setGifUrl(null);
  }

  const current = puzzles[index];
  const timerPercentage = (timeLeft / levelTime) * 100;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-lg bg-content1/80 backdrop-blur-xl border border-white/10 shadow-2xl">
        <CardBody className="flex flex-col items-center gap-6 p-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              Guess The Anime
            </h1>
            <p className="text-sm text-default-500 mt-1">
              Can you name them all?
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full flex items-center gap-3">
            <Progress
              aria-label="Time remaining"
              value={timerPercentage}
              color={timeLeft <= 5 ? "danger" : timeLeft <= 10 ? "warning" : "success"}
              className="flex-1"
              size="md"
            />
            <Chip
              size="sm"
              variant="flat"
              color={timeLeft <= 5 ? "danger" : "default"}
              className="min-w-[48px] justify-center"
            >
              {timeLeft}s
            </Chip>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <Chip variant="bordered" color="secondary">
              Round {index + 1}/{puzzles.length}
            </Chip>
            <Chip variant="bordered" color="success">
              Score: {guessCount}
            </Chip>
          </div>

          {/* Volume Slider */}
          <div className="w-full flex items-center gap-3">
            <span className="text-default-500 text-sm">🔊</span>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(volume * 100)}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="flex-1 h-2 bg-default-300/50 rounded-lg appearance-none cursor-pointer accent-purple-500"
              aria-label="Volume"
            />
            <span className="text-default-500 text-xs w-8">{Math.round(volume * 100)}%</span>
          </div>

          {/* Game Over Banner */}
          <AnimatePresence>
            {lost && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                <Card className="bg-danger/20 border border-danger/50">
                  <CardBody className="text-center py-3">
                    <p className="text-danger font-semibold">
                      Time&apos;s up! The answer was:{" "}
                      <span className="text-white">{current.answer}</span>
                    </p>
                  </CardBody>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Win Banner */}
          <AnimatePresence>
            {isOver && !lost && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-full"
              >
                <Card className="bg-success/20 border border-success/50">
                  <CardBody className="text-center py-4">
                    <p className="text-2xl mb-2">🎉</p>
                    <p className="text-success font-bold text-lg">
                      Congratulations!
                    </p>
                    <p className="text-default-500 text-sm">
                      You completed all {puzzles.length} puzzles!
                    </p>
                  </CardBody>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main game area */}
          <AnimatePresence mode="wait">
            {showingGif ? (
              <motion.div
                key="gif"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-4"
              >
                {gifLoading ? (
                  <div className="text-default-500">Loading...</div>
                ) : gifUrl ? (
                  <div className="relative rounded-xl overflow-hidden shadow-lg shadow-purple-500/20">
                    <Image
                      src={gifUrl}
                      alt="anime gif"
                      width={320}
                      height={192}
                      className="rounded-xl"
                      unoptimized
                    />
                  </div>
                ) : null}
                <Chip color="success" variant="flat" size="lg">
                  ✓ {current.answer}
                </Chip>
              </motion.div>
            ) : (
              <motion.div
                key="puzzle"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center gap-6 w-full"
              >
                {/* Emoji display */}
                <motion.div
                  animate={successFlash ? { scale: [1, 1.1, 1] } : {}}
                  className="select-none text-7xl md:text-8xl py-4"
                >
                  {current.emoji}
                </motion.div>

                {/* Input form */}
                <form onSubmit={handleSubmit} className="w-full">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!started) setStarted(true);
                      setInput(v);
                      const expected = puzzles[index].answer;
                      if (!processing && normalize(v) === normalize(expected)) {
                        setTimeout(() => handleSubmit(), 50);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !processing) handleSubmit();
                    }}
                    placeholder="Type the anime title..."
                    size="lg"
                    variant="bordered"
                    classNames={{
                      input: "text-center text-lg",
                      inputWrapper: "bg-default-100/50 border-default-300 hover:border-primary focus-within:border-primary",
                    }}
                    isDisabled={isOver}
                    autoFocus
                    aria-label="Guess the anime"
                  />
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Restart button */}
          {isOver && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                color="primary"
                size="lg"
                variant="shadow"
                onPress={handleRestart}
                className="font-semibold"
              >
                Play Again
              </Button>
            </motion.div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
