/**
 * @return value between a-z
 */
export function getRandomCharacter(): string {
  return String.fromCharCode(97 + Math.floor(Math.random() * 26));
}
