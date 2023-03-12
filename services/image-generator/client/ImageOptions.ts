import type { ValidFont } from './ValidFont.js';

export interface ArtOptions {
    readonly avatar: string;
}

export interface CahOptions {
    readonly white: string[];
    readonly black: string;
}

export interface CaptionOptions {
    readonly url: string;
    readonly top?: string;
    readonly bottom?: string;
    readonly font: ValidFont;
}

export interface ClintOptions {
    readonly image: string;
}

export interface ClippyOptions {
    readonly text: string;
}

export interface ClydeOptions {
    readonly text: string;
}

export interface ColorOptions {
    readonly color: readonly string[];
}

export interface DeleteOptions {
    readonly text: string;
}

export interface DistortOptions {
    readonly avatar: string;
}

export interface EmojiOptions {
    readonly name: string;
    readonly size: number;
    readonly svg: boolean;
}

export interface FreeOptions {
    readonly top: string;
    readonly bottom?: string;
}

export interface LinusOptions {
    readonly image: string;
}

export interface PCCheckOptions {
    readonly text: string;
}

export interface PixelateOptions {
    readonly url: string;
    readonly scale: number;
}

export interface ShitOptions {
    readonly text: string;
    readonly plural: boolean;
}

export interface SonicSaysOptions {
    readonly text: string;
}

export interface StarVsTheForcesOfOptions {
    readonly avatar: string;
}

export interface StupidOptions {
    readonly text: string;
    readonly avatar?: string;
}

export interface TheSearchOptions {
    readonly text: string;
}

export interface TruthOptions {
    readonly text: string;
}

export interface ImageOptionsMap {
    readonly art: ArtOptions;
    readonly cah: CahOptions;
    readonly caption: CaptionOptions;
    readonly clint: ClintOptions;
    readonly clippy: ClippyOptions;
    readonly clyde: ClydeOptions;
    readonly color: ColorOptions;
    readonly delete: DeleteOptions;
    readonly distort: DistortOptions;
    readonly emoji: EmojiOptions;
    readonly free: FreeOptions;
    readonly linus: LinusOptions;
    readonly pcCheck: PCCheckOptions;
    readonly pixelate: PixelateOptions;
    readonly shit: ShitOptions;
    readonly sonicSays: SonicSaysOptions;
    readonly starVsTheForcesOf: StarVsTheForcesOfOptions;
    readonly stupid: StupidOptions;
    readonly theSearch: TheSearchOptions;
    readonly truth: TruthOptions;
}
