"use client";

import { useMemo } from "react";

type CodePreviewCardProps = {
  code: string;
  progress?: number;
  compact?: boolean;
  className?: string;
  editable?: boolean;
  onClick?: () => void;
};

type TokenType = "keyword" | "string" | "number" | "call" | "plain" | "comment" | "paren" | "operator";

type Token = {
  text: string;
  type: TokenType;
};

const keywordPattern = /\b(function|const|let|var|return|for|if|else|Math|Math\.floor|true|false|new|class|import|from|export|async|await)\b/;
const stringPattern = /^(['"`])(?:\\.|(?!\1).)*\1/;
const numberPattern = /^\b\d+\b/;
const commentPattern = /^\/\/.*$/;
const callPattern = /^\b[A-Za-z_$][\w$]*(?=\()/;
const operatorPattern = /^=>|^[=+\-*/.%]/;

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let remaining = line;

  while (remaining.length > 0) {
    const leadingWhitespace = remaining.match(/^\s+/)?.[0] ?? "";
    if (leadingWhitespace) {
      tokens.push({ text: leadingWhitespace, type: "plain" });
      remaining = remaining.slice(leadingWhitespace.length);
      continue;
    }

    const commentMatch = remaining.match(commentPattern);
    if (commentMatch) {
      tokens.push({ text: commentMatch[0], type: "comment" });
      break;
    }

    const stringMatch = remaining.match(stringPattern);
    if (stringMatch) {
      tokens.push({ text: stringMatch[0], type: "string" });
      remaining = remaining.slice(stringMatch[0].length);
      continue;
    }

    const keywordMatch = remaining.match(keywordPattern);
    if (keywordMatch && keywordMatch.index === 0) {
      tokens.push({ text: keywordMatch[0], type: "keyword" });
      remaining = remaining.slice(keywordMatch[0].length);
      continue;
    }

    const numberMatch = remaining.match(numberPattern);
    if (numberMatch && numberMatch.index === 0) {
      tokens.push({ text: numberMatch[0], type: "number" });
      remaining = remaining.slice(numberMatch[0].length);
      continue;
    }

    const callMatch = remaining.match(callPattern);
    if (callMatch && callMatch.index === 0) {
      tokens.push({ text: callMatch[0], type: "call" });
      remaining = remaining.slice(callMatch[0].length);
      continue;
    }

    const operatorMatch = remaining.match(operatorPattern);
    if (operatorMatch && operatorMatch.index === 0) {
      tokens.push({ text: operatorMatch[0], type: "operator" });
      remaining = remaining.slice(operatorMatch[0].length);
      continue;
    }

    const parenMatch = remaining.match(/^[(){}[\],;]/);
    if (parenMatch) {
      tokens.push({ text: parenMatch[0], type: "paren" });
      remaining = remaining.slice(parenMatch[0].length);
      continue;
    }

    const plainMatch = remaining.match(/^[^(){}[\],;=+\-*/.%'"`<>]+/);
    if (plainMatch) {
      tokens.push({ text: plainMatch[0], type: "plain" });
      remaining = remaining.slice(plainMatch[0].length);
      continue;
    }

    tokens.push({ text: remaining[0], type: "plain" });
    remaining = remaining.slice(1);
  }

  return tokens;
}

function tokenClassName(type: TokenType) {
  switch (type) {
    case "keyword":
      return "text-[#d9a1ff]";
    case "string":
      return "text-[#7ce7b0]";
    case "number":
      return "text-[#ff9b42]";
    case "call":
      return "text-[#ff9b42]";
    case "comment":
      return "text-white/35";
    case "operator":
      return "text-white/70";
    case "paren":
      return "text-white/55";
    default:
      return "text-white/88";
  }
}

export function CodePreviewCard({ code, progress = 1, compact = false, className = "", editable = false, onClick }: CodePreviewCardProps) {
  const lines = useMemo(
    () =>
      code
        .split("\n")
        .filter((line, index, all) => !(line === "" && index === all.length - 1))
        .slice(0, compact ? 14 : 18),
    [code, compact],
  );
  const tokenizedLines = useMemo(() => lines.map((line) => tokenizeLine(line)), [lines]);
  const lineProgress = clamp(progress);
  const windowScale = 0.92 + lineProgress * 0.08;

  return (
    <div className={`relative w-full overflow-visible ${className}`}>
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[150%] w-[180vw] -translate-x-1/2 -translate-y-1/2"
        style={{
          transform: "translate(-50%, -50%) rotate(-3deg) scale(1.05)",
          transformOrigin: "center",
        }}
      >
        <svg viewBox="0 0 1600 820" preserveAspectRatio="none" className="h-full w-full" style={{ opacity: 0.4 }}>
          <g transform="translate(1600 0) scale(-1 1)">
            <path
              d="M -420 190 C -160 -10, 140 70, 420 300 S 700 700, 930 620 S 1200 240, 1440 360 S 1740 760, 2020 220"
              fill="none"
              stroke="#1f93ff"
              strokeWidth={compact ? 26 : 36}
              strokeLinecap="round"
              style={{
                filter: "drop-shadow(0 0 22px rgba(31,147,255,0.3))",
                strokeDasharray: 3000,
                strokeDashoffset: 3000 * (1 - lineProgress),
              }}
            />
          </g>
        </svg>
      </div>
      <div
        className="relative z-10 mx-auto w-full max-w-[920px] overflow-hidden rounded-[16px] border border-white/90 bg-black px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
        style={{
          transform: `rotate(-3deg) scale(${windowScale})`,
          transformOrigin: "center",
          cursor: editable && onClick ? "pointer" : "default",
        }}
        onClick={editable ? onClick : undefined}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_34%,rgba(255,255,255,0.015))]" />
        <div className="relative">
        <div className="mb-5 flex items-center gap-2 opacity-85">
          <span className="h-2.5 w-2.5 rounded-full bg-white/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/55" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/35" />
          {editable ? <span className="ml-3 rounded-full border border-sky-400/20 bg-sky-400/12 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-sky-200">Click to edit</span> : null}
        </div>
        <div className="space-y-[0.48rem] overflow-x-auto font-mono text-[17px] leading-[1.8] tracking-[-0.03em] text-white">
          {lines.map((line, lineIndex) => (
            <div key={`${lineIndex}-${line}`} className="flex min-w-max">
              <div className="mr-4 w-7 shrink-0 text-right text-white/22">{lineIndex + 1}</div>
              <div className="min-w-0 flex-1 whitespace-pre">
                {tokenizedLines[lineIndex].map((token, tokenIndex) => (
                  <span key={`${lineIndex}-${tokenIndex}-${token.text}`} className={tokenClassName(token.type)}>
                    {token.text}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 h-[3px] overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#1f93ff] shadow-[0_0_20px_rgba(31,147,255,0.75)]"
            style={{
              width: `${Math.max(14, lineProgress * 100)}%`,
              transformOrigin: "left center",
            }}
          />
        </div>
        </div>
      </div>
    </div>
  );
}
