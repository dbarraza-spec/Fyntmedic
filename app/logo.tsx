export function LogoF({ color = '#0077b6', size = 26 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.21} viewBox="0 0 28 34" aria-hidden="true">
      <path d="M8 2 L26 0 Q22 9 12 10 L9 10 Z" fill={color} />
      <path d="M6 13 L23 11 Q19 20 10 21 L7 21 Z" fill={color} />
      <path d="M4 24 L13 23 Q10 31 2 34 Z" fill={color} />
    </svg>
  );
}
