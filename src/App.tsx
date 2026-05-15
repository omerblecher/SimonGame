import React, { useCallback, useMemo, useRef, useState } from 'react';

type ColorId = 'green' | 'red' | 'yellow' | 'blue';

type Pad = {
  id: ColorId;
  label: string;
  description: string;
  baseClass: string;
  glowClass: string;
};

const PADS: Pad[] = [
  {
    id: 'green',
    label: 'Green',
    description: 'Upper left',
    baseClass: 'bg-emerald-500',
    glowClass: 'shadow-[0_0_30px_rgba(52,211,153,0.9)]',
  },
  {
    id: 'red',
    label: 'Red',
    description: 'Upper right',
    baseClass: 'bg-rose-500',
    glowClass: 'shadow-[0_0_30px_rgba(244,63,94,0.9)]',
  },
  {
    id: 'yellow',
    label: 'Yellow',
    description: 'Lower left',
    baseClass: 'bg-amber-400',
    glowClass: 'shadow-[0_0_30px_rgba(251,191,36,0.9)]',
  },
  {
    id: 'blue',
    label: 'Blue',
    description: 'Lower right',
    baseClass: 'bg-sky-500',
    glowClass: 'shadow-[0_0_30px_rgba(56,189,248,0.9)]',
  },
];

const PAD_POSITION_CLASSES: Record<ColorId, string> = {
  green: 'top-0 left-0 rounded-tl-[999px]',
  red: 'top-0 right-0 rounded-tr-[999px]',
  yellow: 'bottom-0 left-0 rounded-bl-[999px]',
  blue: 'bottom-0 right-0 rounded-br-[999px]',
};

// Frequencies approximate the original Simon game tones (A major triad) per Wikipedia:
// Blue: E (higher), Yellow: C#, Red: A, Green: E (lower)
const COLOR_TONES: Record<ColorId, number> = {
  // blue: E4, yellow: C#4, red: A3, green: E3
  blue: 329.63,
  yellow: 277.18,
  red: 220.0,
  green: 164.81,
};

const ERROR_TONE = 120;

export const App: React.FC = () => {
  const [sequence, setSequence] = useState<ColorId[]>([]);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [userIndex, setUserIndex] = useState(0);
  const [activePad, setActivePad] = useState<ColorId | null>(null);
  const [round, setRound] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [status, setStatus] = useState<string>('Press Start to begin.');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const isCelebratingRef = useRef(false);

  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.2;
      masterGain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterGainRef.current = masterGain;
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, durationMs: number) => {
      const ctx = ensureAudioContext();
      const masterGain = masterGainRef.current;
      if (!ctx || !masterGain) return;

      const now = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(1, now + 0.01);
      gainNode.gain.linearRampToValueAtTime(0.001, now + durationMs / 1000 - 0.03);

      oscillator.connect(gainNode);
      gainNode.connect(masterGain);

      oscillator.start(now);
      oscillator.stop(now + durationMs / 1000);
    },
    [ensureAudioContext],
  );

  const playColorTone = useCallback(
    (color: ColorId, durationMs: number) => {
      playTone(COLOR_TONES[color], durationMs);
    },
    [playTone],
  );

  const playErrorTone = useCallback(() => {
    playTone(ERROR_TONE, 500);
  }, [playTone]);

  const playJoyMelody = useCallback(async () => {
    if (isCelebratingRef.current) return;
    isCelebratingRef.current = true;

    const notes: Array<{ freq: number; dur: number }> = [
      { freq: COLOR_TONES.green, dur: 150 },
      { freq: COLOR_TONES.red, dur: 150 },
      { freq: COLOR_TONES.yellow, dur: 150 },
      { freq: COLOR_TONES.blue, dur: 250 },
      { freq: COLOR_TONES.blue * 2, dur: 350 },
    ];

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (const note of notes) {
      playTone(note.freq, note.dur);
      await delay(note.dur + 40);
    }

    isCelebratingRef.current = false;
  }, [playTone]);

  const randomColor = useCallback((): ColorId => {
    const index = Math.floor(Math.random() * PADS.length);
    return PADS[index]!.id;
  }, []);

  const resetGame = useCallback(() => {
    setSequence([]);
    setIsPlayingSequence(false);
    setIsUserTurn(false);
    setUserIndex(0);
    setActivePad(null);
    setRound(0);
    setStreak(0);
    setStatus('Press Start to begin.');
  }, []);

  const playSequence = useCallback(
    async (seq: ColorId[]) => {
      setIsPlayingSequence(true);
      setIsUserTurn(false);
      setActivePad(null);

      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      await delay(450);

      const baseOnMs = Math.max(220, 550 - seq.length * 25);
      const baseOffMs = Math.max(120, 260 - seq.length * 15);

      for (const color of seq) {
        setActivePad(color);
        playColorTone(color, baseOnMs + 40);
        await delay(baseOnMs);
        setActivePad(null);
        await delay(baseOffMs);
      }

      setIsPlayingSequence(false);
      setIsUserTurn(true);
      setUserIndex(0);
      setStatus('Your turn – repeat the sequence.');
    },
    [playColorTone],
  );

  const handleStart = useCallback(async () => {
    if (isPlayingSequence) return;

    const startingSequence: ColorId[] = [randomColor()];
    setSequence(startingSequence);
    setRound(1);
    setStreak(0);
    setStatus('Watch the pattern...');

    try { await audioCtxRef.current?.resume(); } catch (_) {}
    await playSequence(startingSequence);
  }, [isPlayingSequence, playSequence, randomColor]);

  const handlePadClick = useCallback(
    async (color: ColorId) => {
      if (!isUserTurn || isPlayingSequence) return;

      try { await audioCtxRef.current?.resume(); } catch (_) {}
      setActivePad(color);
      playColorTone(color, 220);

      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      await delay(200);
      setActivePad(null);

      const expectedColor = sequence[userIndex];

      if (!expectedColor || expectedColor !== color) {
        setStatus('Oops! Wrong move. Sequence reset.');
        setIsUserTurn(false);
        setIsPlayingSequence(true);
        playErrorTone();

        const currentStreakSnapshot = streak;
        if (currentStreakSnapshot > bestStreak) {
          setBestStreak(currentStreakSnapshot);
        }

        await delay(900);
        resetGame();
        return;
      }

      const nextIndex = userIndex + 1;

      if (nextIndex < sequence.length) {
        setUserIndex(nextIndex);
        setStatus('Good! Keep going...');
        return;
      }

      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }

      if (newStreak > 0 && newStreak % 5 === 0) {
        setStatus(`Amazing! ${newStreak} sequences in a row!`);
        void playJoyMelody();
      } else {
        setStatus('Nice! Get ready for the next round...');
      }

      setIsUserTurn(false);
      setIsPlayingSequence(true);

      const nextSequence = [...sequence, randomColor()];
      setSequence(nextSequence);
      setRound(nextSequence.length);

      await delay(850);
      await playSequence(nextSequence);
    },
    [
      bestStreak,
      isPlayingSequence,
      isUserTurn,
      playColorTone,
      playErrorTone,
      playJoyMelody,
      playSequence,
      randomColor,
      resetGame,
      sequence,
      streak,
      userIndex,
    ],
  );

  const isDisabled = useMemo(() => !isUserTurn || isPlayingSequence, [isUserTurn, isPlayingSequence]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="glass-panel rounded-3xl px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                Simon Memory
              </h1>
              <p className="mt-1 text-sm sm:text-base text-slate-300 max-w-md">
                Watch the lights and listen to the tones, then repeat the pattern. How
                long can you keep the streak going?
              </p>
            </div>
            <div className="flex gap-6 sm:gap-8">
              <div className="text-right">
                <div className="stat-label">Round</div>
                <div className="stat-value text-emerald-300">{round}</div>
              </div>
              <div className="text-right">
                <div className="stat-label">Streak</div>
                <div className="stat-value text-amber-300">{streak}</div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="stat-label">Best Streak</div>
                <div className="stat-value text-sky-300">{bestStreak}</div>
              </div>
            </div>
          </header>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-center">
            <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
              <div className="relative w-full h-full rounded-full bg-zinc-950 shadow-[0_24px_60px_rgba(0,0,0,0.9)] border-[12px] border-black">
                {/* Colored quadrants */}
                {PADS.map((pad) => {
                  const isActive = activePad === pad.id;
                  const baseClasses =
                    'absolute w-1/2 h-1/2 border-[8px] border-zinc-950 transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black';
                  const interactiveClasses = isDisabled && !isActive
                    ? 'cursor-not-allowed'
                    : !isDisabled
                      ? 'cursor-pointer hover:brightness-110'
                      : '';
                  const activeClasses = isActive
                    ? `${pad.glowClass} scale-[1.03] brightness-125`
                    : 'shadow-[0_0_22px_rgba(0,0,0,0.8)]';

                  return (
                    <button
                      key={pad.id}
                      type="button"
                      disabled={isDisabled && !isActive}
                      style={{ touchAction: 'manipulation' }}
                      onClick={() => handlePadClick(pad.id)}
                      aria-label={pad.label}
                      className={[
                        baseClasses,
                        interactiveClasses,
                        activeClasses,
                        PAD_POSITION_CLASSES[pad.id],
                        pad.baseClass,
                      ].join(' ')}
                    >
                      <div className="absolute inset-0 rounded-[999px] bg-gradient-to-br from-white/20 via-transparent to-black/20 mix-blend-soft-light pointer-events-none" />
                    </button>
                  );
                })}

                {/* Inner metallic center disc */}
                <div className="pointer-events-none absolute inset-[26%] rounded-full bg-gradient-to-br from-zinc-200 via-zinc-400 to-zinc-700 border-[6px] border-zinc-900 shadow-[0_0_40px_rgba(0,0,0,0.9)] flex flex-col items-center justify-between text-center py-3 px-4">
                  <div className="flex items-center justify-center gap-2 text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-700">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-[8px] text-white font-black">
                      MB
                    </span>
                    <span>Electronic</span>
                  </div>

                  <div className="text-3xl font-black tracking-[0.35em] text-zinc-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] uppercase">
                    Simon
                  </div>

                  <div className="flex flex-col items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.9)]" />
                      <span>Last</span>
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
                      <span>Longest</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="flex flex-col items-center gap-0.5">
                        <span className="h-3 w-6 rounded-[999px] bg-sky-700 border border-zinc-900 shadow-inner" />
                        <span>Game</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span>Off</span>
                        <span className="h-3 w-8 rounded-[999px] bg-sky-700 border border-zinc-900 shadow-inner" />
                        <span>On</span>
                      </span>
                    </div>

                    <div className="mt-1 text-[9px] font-semibold tracking-[0.22em] text-zinc-900">
                      {isPlayingSequence ? 'WATCH' : isUserTurn ? 'REPEAT' : 'IDLE'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:max-w-sm space-y-5">
              <div className="rounded-2xl bg-slate-900/80 border border-slate-700/70 px-4 py-3">
                <div className="text-xs font-semibold tracking-wide text-slate-400 uppercase mb-1">
                  Status
                </div>
                <p className="text-sm sm:text-base text-slate-100 min-h-[2.5rem]">
                  {status}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={isPlayingSequence}
                  className={[
                    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all',
                    'bg-emerald-500 text-emerald-950 shadow-[0_10px_30px_rgba(34,197,94,0.35)]',
                    'hover:bg-emerald-400 hover:shadow-[0_16px_45px_rgba(34,197,94,0.55)]',
                    'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none',
                  ].join(' ')}
                >
                  {sequence.length === 0 ? 'Start Game' : 'Replay / Next Round'}
                </button>

                <button
                  type="button"
                  onClick={resetGame}
                  disabled={sequence.length === 0 && !isPlayingSequence && !isUserTurn}
                  className={[
                    'inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-medium border transition-all',
                    'border-slate-600/80 text-slate-200 bg-slate-900/70',
                    'hover:bg-slate-800/90 hover:border-slate-400/80',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                  ].join(' ')}
                >
                  Reset
                </button>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-xs sm:text-sm text-slate-300">
                <div className="rounded-xl bg-slate-900/70 border border-slate-700/70 px-3 py-2">
                  <dt className="stat-label mb-0.5">Best Streak</dt>
                  <dd className="stat-value text-sky-300 text-lg">{bestStreak}</dd>
                </div>
                <div className="rounded-xl bg-slate-900/70 border border-slate-700/70 px-3 py-2">
                  <dt className="stat-label mb-0.5">Mode</dt>
                  <dd className="text-sm font-medium text-emerald-200">
                    Classic single-player
                  </dd>
                </div>
                <div className="col-span-2 rounded-xl bg-slate-900/70 border border-slate-700/70 px-3 py-3">
                  <dt className="stat-label mb-1.5">How to play</dt>
                  <dd className="text-[11px] sm:text-xs leading-relaxed text-slate-200">
                    Press <span className="font-semibold text-emerald-300">Start Game</span> and
                    watch which pads light up and play a tone. Then tap the pads in the same
                    order. Each round adds one more step. A{' '}
                    <span className="font-semibold text-amber-300">celebration melody</span> plays
                    every 5 sequences you repeat correctly in a row. A low buzzer means a mistake
                    and the pattern resets.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

