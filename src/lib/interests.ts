export const INTERESTS = [
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'history', label: 'History', icon: '📜' },
  { id: 'geography', label: 'Geography', icon: '🗺️' },
  { id: 'politics', label: 'Politics', icon: '🏛️' },
] as const;

export type Interest = (typeof INTERESTS)[number]['id'];

export const INTEREST_IDS = INTERESTS.map((i) => i.id) as [Interest, ...Interest[]];

const icon = new Map<string, string>(INTERESTS.map((i) => [i.id, i.icon]));
export const interestIcons = (tags: readonly string[] | undefined): string => (tags ?? []).map((t) => icon.get(t) ?? '').join(' ');

/** Does this content match at least one thing the learner cares about? Untagged content is neutral. */
export const matches = (tags: readonly string[] | undefined, mine: readonly string[]): boolean =>
  !!tags?.some((t) => mine.includes(t));

/** Stable sort: content matching the learner's interests first, original order otherwise. */
export function forYouFirst<T extends { tags?: readonly string[] }>(list: readonly T[], mine: readonly string[]): T[] {
  return [...list].sort((a, b) => Number(matches(b.tags, mine)) - Number(matches(a.tags, mine)));
}
