import { useState, useRef, useCallback, useEffect } from "react";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const GLITCH_PHRASES = [
  "SSSPEAKK TO MEEE",
  "ERRRR0R 404",
  "HELLLL0 W0RLD",
  "C4N Y0U H34R ME",
  "GL1TCH M0DE",
  "S3GM3NT F4ULT",
  "D4T4 C0RRUPT",
];

interface AudioParams {
  delayTime: number;
  feedback: number;
  reverb: number;
  distortion: number;
  filterFreq: number;
  pitch: number;
  glitchAmount: number;
}

export default function SpeakNGlitch() {
  const [displayText, setDisplayText] = useState("SPEAKN GLITCH");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isGlitching, setIsGlitching] = useState(false);
  const [glitchText, setGlitchText] = useState("");
  const [params, setParams] = useState<AudioParams>({
    delayTime: 0.35,
    feedback: 0.4,
    reverb: 0.5,
    distortion: 0.3,
    filterFreq: 0.5,
    pitch: 0.5,
    glitchAmount: 0.4,
  });
  const [power, setPower] = useState(true);
  const [speakMode, setSpeakMode] = useState<"letter" | "word">("letter");
  const [scanLine, setScanLine] = useState(0);
  const [ledBlink, setLedBlink] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const glitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanLine((prev) => (prev + 1) % 100);
    }, 16);
    return () => clearInterval(scanInterval);
  }, []);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setLedBlink((prev) => !prev);
    }, power ? 1200 : 300);
    return () => clearInterval(blinkInterval);
  }, [power]);

  const createReverbBuffer = useCallback((ctx: AudioContext, seconds: number, decay: number) => {
    const length = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return buffer;
  }, []);

  const createDistortionCurve = useCallback((amount: number) => {
    const samples = 256;
    const curve = new Float32Array(samples);
    const k = amount * 400;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((Math.PI + k) * x) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }, []);

  const triggerGlitch = useCallback(() => {
    if (params.glitchAmount < 0.1) return;
    const chance = params.glitchAmount;
    if (Math.random() > chance) return;

    setIsGlitching(true);
    const phrase = GLITCH_PHRASES[Math.floor(Math.random() * GLITCH_PHRASES.length)];
    setGlitchText(phrase);

    if (glitchTimerRef.current) clearTimeout(glitchTimerRef.current);
    glitchTimerRef.current = setTimeout(() => {
      setIsGlitching(false);
      setGlitchText("");
    }, 300 + Math.random() * 400);
  }, [params.glitchAmount]);

  const playGlitchedLetter = useCallback(
    async (letter: string) => {
      if (!power) return;

      const ctx = getAudioCtx();

      const utterance = new SpeechSynthesisUtterance(
        speakMode === "letter" ? letter : displayText
      );
      const voices = window.speechSynthesis.getVoices();
      const robotVoice = voices.find(
        (v) =>
          v.name.toLowerCase().includes("samantha") ||
          v.name.toLowerCase().includes("google us") ||
          v.name.toLowerCase().includes("zira") ||
          v.name.toLowerCase().includes("microsoft")
      );
      if (robotVoice) utterance.voice = robotVoice;
      utterance.rate = 0.6 + params.pitch * 0.8;
      utterance.pitch = 0.1 + params.pitch * 1.5;
      utterance.volume = 1;

      triggerGlitch();

      const oscillators: OscillatorNode[] = [];
      const gainNodes: GainNode[] = [];

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.7;

      const delayNode = ctx.createDelay(2.0);
      delayNode.delayTime.value = 0.05 + params.delayTime * 0.6;

      const feedbackGain = ctx.createGain();
      feedbackGain.gain.value = params.feedback * 0.75;

      const convolver = ctx.createConvolver();
      convolver.buffer = createReverbBuffer(ctx, 1.5 + params.reverb * 2, 2);

      const reverbGain = ctx.createGain();
      reverbGain.gain.value = params.reverb;

      const dryGain = ctx.createGain();
      dryGain.gain.value = 1 - params.reverb * 0.5;

      const distortion = ctx.createWaveShaper();
      distortion.curve = createDistortionCurve(params.distortion);
      distortion.oversample = "4x";

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 200 + params.filterFreq * 3800;
      filter.Q.value = 2 + params.filterFreq * 8;

      const acidFilter = ctx.createBiquadFilter();
      acidFilter.type = "lowpass";
      acidFilter.frequency.value = 800 + params.filterFreq * 8000;
      acidFilter.Q.value = params.filterFreq * 20;

      const numOscs = 3 + Math.floor(params.glitchAmount * 4);
      const baseFreqs: { [key: string]: number } = {
        A: 440, B: 494, C: 523, D: 587, E: 659, F: 698, G: 784,
        H: 880, I: 988, J: 1047, K: 1175, L: 1319, M: 1397, N: 1568,
        O: 1760, P: 1976, Q: 2093, R: 2349, S: 2637, T: 2794, U: 3136,
        V: 3520, W: 3951, X: 4186, Y: 4435, Z: 4978,
      };

      const baseFreq = baseFreqs[letter] || 440;

      for (let i = 0; i < numOscs; i++) {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        const types: OscillatorType[] = ["sawtooth", "square", "triangle", "sawtooth"];
        osc.type = types[i % types.length];

        const glitchMod = params.glitchAmount > 0.3 ? (Math.random() - 0.5) * params.glitchAmount * 0.5 : 0;
        osc.frequency.value = baseFreq * (0.25 + i * 0.12) * (1 + glitchMod);

        if (params.glitchAmount > 0.5) {
          osc.frequency.setValueAtTime(osc.frequency.value, ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(
            osc.frequency.value * (1 + (Math.random() - 0.5) * 0.3),
            ctx.currentTime + 0.1
          );
        }

        oscGain.gain.value = 0.08 / numOscs;
        oscGain.gain.setTargetAtTime(0, ctx.currentTime + 0.3, 0.1);

        osc.connect(oscGain);
        oscGain.connect(distortion);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);

        oscillators.push(osc);
        gainNodes.push(oscGain);
      }

      distortion.connect(filter);
      filter.connect(acidFilter);
      acidFilter.connect(dryGain);
      acidFilter.connect(convolver);
      convolver.connect(reverbGain);

      dryGain.connect(delayNode);
      reverbGain.connect(delayNode);
      delayNode.connect(feedbackGain);
      feedbackGain.connect(delayNode);
      delayNode.connect(masterGain);

      dryGain.connect(masterGain);
      reverbGain.connect(masterGain);

      masterGain.connect(ctx.destination);

      if (params.glitchAmount > 0.6) {
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
          noiseData[i] = (Math.random() * 2 - 1) * params.glitchAmount * 0.3;
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.15;
        noiseSource.connect(noiseGain);
        noiseGain.connect(masterGain);
        noiseSource.start(ctx.currentTime);
      }

      window.speechSynthesis.cancel();
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 80);
    },
    [
      power,
      getAudioCtx,
      params,
      speakMode,
      displayText,
      triggerGlitch,
      createReverbBuffer,
      createDistortionCurve,
    ]
  );

  const handleLetterClick = useCallback(
    (letter: string) => {
      if (!power) return;
      setActiveKey(letter);
      setDisplayText((prev) => {
        const next = prev + letter;
        return next.length > 16 ? letter : next;
      });
      playGlitchedLetter(letter);
      setTimeout(() => setActiveKey(null), 200);
    },
    [power, playGlitchedLetter]
  );

  const handleClear = useCallback(() => {
    if (!power) return;
    setDisplayText("");
    window.speechSynthesis.cancel();
  }, [power]);

  const handleSpeak = useCallback(() => {
    if (!power || !displayText) return;
    const ctx = getAudioCtx();
    triggerGlitch();

    const utterance = new SpeechSynthesisUtterance(displayText);
    const voices = window.speechSynthesis.getVoices();
    const robotVoice = voices.find(
      (v) =>
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("google us") ||
        v.name.toLowerCase().includes("zira")
    );
    if (robotVoice) utterance.voice = robotVoice;
    utterance.rate = 0.5 + params.pitch * 0.8;
    utterance.pitch = 0.1 + params.pitch * 1.5;

    const convolver = ctx.createConvolver();
    convolver.buffer = createReverbBuffer(ctx, 2, 2);

    window.speechSynthesis.speak(utterance);
  }, [power, displayText, getAudioCtx, params, triggerGlitch, createReverbBuffer]);

  const handleGlitchBurst = useCallback(() => {
    if (!power) return;
    const burst = Array.from({ length: 5 }, () =>
      LETTERS[Math.floor(Math.random() * LETTERS.length)]
    ).join("");
    setDisplayText(burst);
    setIsGlitching(true);
    burst.split("").forEach((l, i) => {
      setTimeout(() => playGlitchedLetter(l), i * 120);
    });
    setTimeout(() => setIsGlitching(false), 800);
  }, [power, playGlitchedLetter]);

  const Knob = ({
    label,
    value,
    param,
    color,
  }: {
    label: string;
    value: number;
    param: keyof AudioParams;
    color: string;
  }) => {
    const rotation = -135 + value * 270;
    return (
      <div className="flex flex-col items-center gap-1">
        <div
          className="relative w-10 h-10 cursor-pointer select-none"
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            const normalized = ((angle + Math.PI) / (Math.PI * 2) + 0.625) % 1;
            setParams((prev) => ({ ...prev, [param]: Math.max(0, Math.min(1, normalized)) }));
          }}
          onWheel={(e) => {
            e.preventDefault();
            setParams((prev) => ({
              ...prev,
              [param]: Math.max(0, Math.min(1, prev[param] - e.deltaY * 0.002)),
            }));
          }}
        >
          <div
            className="w-10 h-10 rounded-full border-4 border-gray-600 shadow-lg"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${color}44, #1a1a1a)`,
              boxShadow: `0 0 8px ${color}66, inset 0 2px 4px rgba(0,0,0,0.5)`,
            }}
          >
            <div
              className="absolute w-1 h-3 rounded-full top-1 left-1/2 -translate-x-1/2 origin-bottom"
              style={{
                background: color,
                transform: `translateX(-50%) rotate(${rotation}deg)`,
                transformOrigin: "50% 100%",
                boxShadow: `0 0 4px ${color}`,
              }}
            />
          </div>
        </div>
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-mono" style={{ color }}>{Math.round(value * 100)}</span>
      </div>
    );
  };

  const displayContent = isGlitching && glitchText ? glitchText : displayText;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse at center, #0a0a0a 0%, #000 100%)",
        fontFamily: "'Courier New', monospace",
      }}
    >
      <div
        className="relative w-full max-w-lg"
        style={{
          background: "linear-gradient(145deg, #c8400a 0%, #a33008 40%, #7a2005 100%)",
          borderRadius: "24px 24px 40px 40px",
          boxShadow: "0 0 40px rgba(200, 64, 10, 0.3), 0 20px 60px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,150,80,0.2)",
          border: "3px solid #e85020",
          padding: "24px",
        }}
      >
        {/* Scratches overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: "inherit",
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.03) 2px,
              rgba(0,0,0,0.03) 3px
            )`,
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div
              className="text-2xl font-black tracking-widest"
              style={{
                color: "#f0c040",
                textShadow: "0 0 10px rgba(240,192,64,0.5), 2px 2px 0 rgba(0,0,0,0.5)",
                letterSpacing: "0.15em",
              }}
            >
              SPEAK 'N{" "}
              <span
                className={isGlitching ? "animate-pulse" : ""}
                style={{
                  color: "#00ff88",
                  textShadow: isGlitching ? "0 0 20px #00ff88, 0 0 40px #00ff88" : "0 0 10px rgba(0,255,136,0.4)",
                }}
              >
                GL1TCH
              </span>
            </div>
            <div className="text-xs text-orange-300 tracking-widest opacity-60">EDUCATIONAL SYNTHESIZER v0.∞</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-4 h-4 rounded-full cursor-pointer"
              style={{
                background: ledBlink ? (power ? "#00ff00" : "#ff0000") : "#003300",
                boxShadow: ledBlink && power ? "0 0 8px #00ff00, 0 0 16px #00ff00" : "none",
              }}
              onClick={() => setPower(!power)}
            />
            <span className="text-xs text-orange-300">PWR</span>
          </div>
        </div>

        {/* Screen */}
        <div
          className="relative mb-5 overflow-hidden"
          style={{
            background: "#0a1a0a",
            border: "4px solid #2a3a2a",
            borderRadius: "8px",
            padding: "12px 16px",
            boxShadow: "inset 0 0 20px rgba(0,0,0,0.8), 0 0 10px rgba(0,255,0,0.1)",
            minHeight: "72px",
          }}
        >
          {/* Scanline */}
          <div
            className="absolute left-0 right-0 h-px pointer-events-none opacity-30"
            style={{
              top: `${scanLine}%`,
              background: "linear-gradient(90deg, transparent, #00ff00, transparent)",
            }}
          />
          {/* CRT overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)`,
              zIndex: 1,
            }}
          />

          <div
            className={`text-2xl font-black tracking-widest text-center relative z-0 ${isGlitching ? "animate-bounce" : ""}`}
            style={{
              color: "#00ff00",
              textShadow: isGlitching
                ? "0 0 10px #00ff00, 2px 0 #ff0000, -2px 0 #0000ff"
                : "0 0 8px #00ff00, 0 0 16px rgba(0,255,0,0.3)",
              minHeight: "32px",
              wordBreak: "break-all",
              filter: isGlitching ? "hue-rotate(90deg)" : "none",
              transition: "filter 0.05s",
            }}
          >
            {power ? (displayContent || "▮") : "- - - - - -"}
          </div>
        </div>

        {/* Mode and Action Buttons */}
        <div className="flex gap-2 mb-4 justify-center">
          <button
            onClick={() => setSpeakMode("letter")}
            className="px-3 py-1 text-xs font-mono font-bold rounded tracking-wider"
            style={{
              background: speakMode === "letter" ? "#f0c040" : "#4a2008",
              color: speakMode === "letter" ? "#1a0800" : "#f0c040",
              border: "2px solid #f0c040",
              boxShadow: speakMode === "letter" ? "0 0 8px rgba(240,192,64,0.5)" : "none",
            }}
          >
            LETTER
          </button>
          <button
            onClick={() => setSpeakMode("word")}
            className="px-3 py-1 text-xs font-mono font-bold rounded tracking-wider"
            style={{
              background: speakMode === "word" ? "#f0c040" : "#4a2008",
              color: speakMode === "word" ? "#1a0800" : "#f0c040",
              border: "2px solid #f0c040",
              boxShadow: speakMode === "word" ? "0 0 8px rgba(240,192,64,0.5)" : "none",
            }}
          >
            WORD
          </button>
          <button
            onClick={handleSpeak}
            className="px-3 py-1 text-xs font-mono font-bold rounded tracking-wider"
            style={{
              background: "#004400",
              color: "#00ff00",
              border: "2px solid #00ff00",
              boxShadow: "0 0 6px rgba(0,255,0,0.3)",
            }}
          >
            ▶ SPEAK
          </button>
          <button
            onClick={handleGlitchBurst}
            className="px-3 py-1 text-xs font-mono font-bold rounded tracking-wider animate-pulse"
            style={{
              background: "#1a0040",
              color: "#aa00ff",
              border: "2px solid #aa00ff",
              boxShadow: "0 0 8px rgba(170,0,255,0.4)",
            }}
          >
            ⚡ GLITCH
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1 text-xs font-mono font-bold rounded tracking-wider"
            style={{
              background: "#400000",
              color: "#ff4444",
              border: "2px solid #ff4444",
            }}
          >
            CLR
          </button>
        </div>

        {/* Alphabet Keys */}
        <div
          className="rounded-lg p-3 mb-4"
          style={{
            background: "rgba(0,0,0,0.3)",
            border: "2px solid rgba(255,100,20,0.2)",
          }}
        >
          <div className="flex flex-wrap gap-1.5 justify-center">
            {LETTERS.map((letter) => (
              <button
                key={letter}
                onClick={() => handleLetterClick(letter)}
                className="relative font-black text-sm rounded transition-all duration-75"
                style={{
                  width: "34px",
                  height: "34px",
                  background:
                    activeKey === letter
                      ? "linear-gradient(145deg, #ffdd44, #ffa000)"
                      : "linear-gradient(145deg, #2a2a2a, #1a1a1a)",
                  color: activeKey === letter ? "#1a0800" : "#e8c060",
                  border: `2px solid ${activeKey === letter ? "#ffdd44" : "#444"}`,
                  boxShadow:
                    activeKey === letter
                      ? "0 0 12px rgba(255,220,68,0.6), 0 2px 0 rgba(0,0,0,0.5)"
                      : "0 2px 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
                  transform: activeKey === letter ? "translateY(2px) scale(0.95)" : "translateY(0) scale(1)",
                  cursor: power ? "pointer" : "not-allowed",
                  opacity: power ? 1 : 0.4,
                  fontFamily: "'Courier New', monospace",
                  fontSize: "13px",
                  letterSpacing: "0",
                }}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        {/* FX Knobs */}
        <div
          className="rounded-lg p-3"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "2px solid rgba(255,100,20,0.2)",
          }}
        >
          <div className="text-xs font-mono text-center text-orange-400 mb-3 tracking-widest opacity-70">
            ◈ FX CONTROL MATRIX ◈
          </div>
          <div className="flex justify-around flex-wrap gap-3">
            <Knob label="DELAY" value={params.delayTime} param="delayTime" color="#00ffff" />
            <Knob label="FEED" value={params.feedback} param="feedback" color="#00aaff" />
            <Knob label="VERB" value={params.reverb} param="reverb" color="#aa44ff" />
            <Knob label="DIST" value={params.distortion} param="distortion" color="#ff4444" />
            <Knob label="ACID" value={params.filterFreq} param="filterFreq" color="#ffaa00" />
            <Knob label="PITCH" value={params.pitch} param="pitch" color="#00ff88" />
            <Knob label="GLITCH" value={params.glitchAmount} param="glitchAmount" color="#ff00ff" />
          </div>
        </div>

        {/* Bottom branding */}
        <div className="text-center mt-3 text-xs text-orange-700 opacity-50 font-mono tracking-widest">
          ☠ CORRUPTED BY DESIGN ☠
        </div>

        {/* Glitch overlay */}
        {isGlitching && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: "inherit",
              background: "linear-gradient(90deg, rgba(255,0,0,0.05) 0%, rgba(0,0,255,0.05) 100%)",
              mixBlendMode: "screen",
              animation: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}
