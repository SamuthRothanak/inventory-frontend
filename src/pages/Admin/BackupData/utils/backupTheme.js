export function getBackupTheme(isDark) {
  return {
    page: isDark ? "text-white" : "text-zinc-950",
    card: isDark
      ? "border-white/10 bg-[#18181b] text-white"
      : "border-zinc-200 bg-white text-zinc-950",
    softCard: isDark
      ? "border-white/10 bg-white/[0.04]"
      : "border-zinc-200 bg-zinc-50",
    muted: isDark ? "text-zinc-400" : "text-zinc-500",
    input: isDark
      ? "border-white/10 bg-[#111113] text-white placeholder:text-zinc-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-red-500 focus:ring-red-500/20",
    divider: isDark ? "border-white/10" : "border-zinc-200",
  };
}

export function toneClasses(tone = "red") {
  const tones = {
    red: "bg-red-500/10 text-red-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
    blue: "bg-blue-500/10 text-blue-500",
    amber: "bg-amber-500/10 text-amber-500",
    purple: "bg-purple-500/10 text-purple-500",
  };

  return tones[tone] || tones.red;
}

