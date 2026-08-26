export function formatWhen(iso: string) {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "الآن";
  if (m < 60) return `${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} س`;
  const d = Math.floor(h / 24);
  if (d === 1) return "أمس";
  return `${d} ي`;
}

export function formatClock(iso: string) {
  return new Intl.DateTimeFormat("ar", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}
