export interface EmojiOptions {
    readonly name: string;
    readonly size: number;
    readonly svg: boolean;
}

export interface TruthOptions {
    readonly text: string;
}

export interface StarVsTheForcesOfOptions {
    readonly avatar: string;
}

export interface StupidOptions {
    readonly text: string;
    readonly avatar?: string;
}

export interface PixelateOptions {
    readonly url: string;
    readonly scale: number;
}

export interface FreeOptions {
    readonly top: string;
    readonly bottom?: string;
}

export interface DistortOptions {
    readonly avatar: string;
}

export interface ClydeOptions {
    readonly text: string;
}

export interface ClippyOptions {
    readonly text: string;
}

export interface CaptionOptions {
    readonly url: string;
    readonly top?: string;
    readonly bottom?: string;
    readonly font: ValidFont;
}

export interface CahOptions {
    readonly white: string[];
    readonly black: string;
}

export interface ArtOptions {
    readonly avatar: string;
}

export type ValidFont =
    | 'ARCENA.ttf'
    | 'arial.ttf'
    | 'animeace.ttf'
    | 'AnnieUseYourTelescope.ttf'
    | 'comicjens.ttf'
    | 'impact.ttf'
    | 'SFToontime.ttf'
    | 'delius.ttf'
    | 'IndieFlower.ttf'
    | 'Roboto-Regular.ttf'
    | 'Ubuntu-Regular.ttf'
    | 'comicsans.ttf'
    | 'whitney.ttf';
