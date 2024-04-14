/**
 * @return value between a-z
 */
export function getRandomCharacter(): string {
  return String.fromCharCode(97 + Math.floor(Math.random() * 26));
}

/**
 * min and max included
 * @param min
 * @param max
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
