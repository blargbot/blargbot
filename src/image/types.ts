import { CommandMap } from 'blargbot-image-api';
import gm from 'gm';

export type ImageIPCContract = {
    [P in keyof ImageGeneratorMap]: { masterGets: ImageResult<string> | null; workerGets: ImageGeneratorMap[P]; };
}

export type MagickSource = string | Buffer | gm.State | [width: number, height: number, color?: string];

export interface TextOptions {
    font?: string;
    fontsize?: number;
    size: `${number | ''}x${number | ''}`;
    fill?: string;
    gravity?: string;
    stroke?: string;
    strokewidth?: string;
}

export interface PhantomOptions {
    replacements?: { [elementId: string]: string; };
    scale?: number;
    format?: string;
}

export interface PhantomTransformOptions<T> extends PhantomOptions {
    transform: (arg: T) => void;
    transformArg: T;
}

export interface ImageRequest<T extends keyof ImageGeneratorMap, R = ImageGeneratorMap[T]> {
    command: T;
    data: R;
}

export interface ImageResult<T = Buffer> {
    data: T;
    fileName: string;
}

export interface ImageGeneratorMap extends CommandMap {
    'truth': TruthOptions;
    'starVsTheForcesOf': StarVsTheForcesOfOptions;
    'stupid': StupidOptions;
    'pixelate': PixelateOptions;
    'free': FreeOptions;
    'distort': DistortOptions;
    'clyde': ClydeOptions;
    'clippy': ClippyOptions;
    'caption': CaptionOptions;
    'cah': CahOptions;
    'art': ArtOptions;
}

export interface TruthOptions {
    text: string;
}

export interface StarVsTheForcesOfOptions {
    avatar: string;
}

export interface StupidOptions {
    text: string;
    avatar?: string;
}

export interface PixelateOptions {
    url: string;
    scale: number;
}

export interface FreeOptions {
    top: string;
    bottom?: string;
}

export interface DistortOptions {
    avatar: string;
}

export interface ClydeOptions {
    text: string;
}

export interface ClippyOptions {
    text: string;
}

export interface CaptionOptions {
    url: string;
    input: {
        top?: string;
        bottom?: string;
    };
    font: ValidFont;
}

export interface CahOptions {
    white: string[];
    black: string;
}

export interface ArtOptions {
    avatar: string;
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
    | 'comicsans.ttf';
