import { FlagDefinition } from './flags';

export interface StoredTag {
    readonly name: string;
    readonly content: string;
    readonly author: string;
    readonly authorizer?: string;
    readonly uses: number;
    readonly flags?: readonly FlagDefinition[];
    readonly cooldown?: number;
    readonly lastuse?: Date;
    readonly lastmodified: Date;
    readonly deleted?: boolean;
    readonly lang?: string;
    readonly deleter?: string;
    readonly reason?: string;
    readonly favourites?: { readonly [key: string]: boolean | undefined; };
    readonly reports?: number;
}
