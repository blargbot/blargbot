import type { CommandMap } from 'blargbot-image-api';
import type gm from 'gm';

export type ImageIPCContract = {
    [P in keyof ImageGeneratorMap]: { masterGets: ImageResult<string> | null; workerGets: ImageGeneratorMap[P]; };
}

export type MagickSource = string | Buffer | gm.State | [width: number, height: number, color?: string];

export interface TextOptions {
    readonly font: ValidFont;
    readonly fontsize?: number;
    readonly width: number;
    readonly height?: number;
    readonly fill?: string;
    readonly gravity?: gm.GravityDirection;
    readonly outline?: [color: string, width: number];
}

export interface ImageRequest<T extends keyof ImageGeneratorMap, R = ImageGeneratorMap[T]> {
    readonly command: T;
    readonly data: R;
}

export interface ImageResult<T = Buffer> {
    readonly data: T;
    readonly fileName: string;
}

export interface ImageGeneratorMap extends CommandMap {
    truth: TruthOptions;
    starVsTheForcesOf: StarVsTheForcesOfOptions;
    stupid: StupidOptions;
    pixelate: PixelateOptions;
    free: FreeOptions;
    distort: DistortOptions;
    clyde: ClydeOptions;
    clippy: ClippyOptions;
    caption: CaptionOptions;
    cah: CahOptions;
    art: ArtOptions;
    emoji: EmojiOptions;
}

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
