export function Sort<T>(items: Array<T>, from: number, to: number): T[] {
  const fromItem = items.splice(from, 1)[0];
  items.splice(to, 0, fromItem);
  return items.slice();
}
