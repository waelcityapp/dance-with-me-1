export function EventStartTimeField({ lang, value, onChange }: {
  lang: 'ar' | 'en';
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2 self-start text-xs font-semibold">
      <span>{lang === 'ar' ? 'وقت البداية بتوقيت القاهرة (اختياري)' : 'Start time in Cairo (optional)'}</span>
      <input
        type="time"
        dir="ltr"
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
      />
    </label>
  );
}
