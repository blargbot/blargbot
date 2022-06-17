export interface GuildWarnings {
    readonly users?: { readonly [userId: string]: number | undefined; };
}
