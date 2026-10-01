export function hueFromString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return h
}

export function gradientCover(id: string): string {
  const hue = hueFromString(id)
  const h2 = (hue + 45) % 360
  return `linear-gradient(155deg, hsl(${hue} 62% 46%), hsl(${h2} 55% 26%) 60%, hsl(${h2} 60% 14%))`
}
