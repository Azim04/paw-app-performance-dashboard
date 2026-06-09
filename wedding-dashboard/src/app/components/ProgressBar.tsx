type Props = {
  value: number; // 0-100
  color?: string;
  height?: string;
};

export default function ProgressBar({ value, color = "bg-violet-500", height = "h-2" }: Props) {
  return (
    <div className={`w-full ${height} bg-zinc-800 rounded-full overflow-hidden`}>
      <div
        className={`${height} ${color} rounded-full transition-all duration-700`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}
