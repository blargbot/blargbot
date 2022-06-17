export function pluralise<Singular extends string>(value: number, singular: Singular): Singular | `${Singular}s`;
export function pluralise<Singular extends string, Plural extends string>(value: number, singular: Singular, plural: Plural): Singular | Plural
export function pluralise(value: number, singular: string, plural?: string): string {
    return value === 1 ? singular : plural ?? `${singular}s`;
}
