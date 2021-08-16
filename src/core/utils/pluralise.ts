export function pluralise<TSingle extends string>(value: number, singular: TSingle): TSingle | `${TSingle}s`;
export function pluralise<TSingle extends string, TPlural extends string>(value: number, singular: TSingle, plural: TPlural): TSingle | TPlural
export function pluralise(value: number, singular: string, plural?: string): string {
    return value === 1 ? singular : plural ?? `${singular}s`;
}
