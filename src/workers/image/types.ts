import gm from 'gm';
import Jimp from 'jimp';

export type MagickSource = string | Jimp | Buffer | gm.State | [width: number, height: number, color?: string];

export interface TextOptions {
    font?: string;
    fontsize?: number;
    size: string;
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

export interface JimpGifEncoderOptions {
    width: number;
    height: number;
    repeat?: number;
    quality?: number;
    delay?: number;
}

export interface ImageRequest<T extends keyof ImageGeneratorMap, R = ImageGeneratorMap[T]> {
    command: T;
    data: R;
}

export interface ImageResult<T = Buffer> {
    data: T;
    fileName: string;
}

export interface ImageGeneratorMap {
    'truth': TruthOptions;
    'triggered': TriggeredOptions;
    'theSearch': TheSearchOptions;
    'starVsTheForcesOf': StarVsTheForcesOfOptions;
    'sonicSays': SonicSaysOptions;
    'shit': ShitOptions;
    'retarded': RetardedOptions;
    'pixelate': PixelateOptions;
    'pcCheck': PCCheckOptions;
    'free': FreeOptions;
    'distort': DistortOptions;
    'delete': DeleteOptions;
    'color': ColorOptions;
    'clyde': ClydeOptions;
    'clippy': ClippyOptions;
    'clint': ClintOptions;
    'caption': CaptionOptions;
    'cah': CAHOptions;
    'art': ArtOptions;
}

export interface TruthOptions {
    text: string;
}

export interface TriggeredOptions {
    avatar: string;
    inverted: boolean;
    horizontal: boolean;
    vertical: boolean;
    sepia: boolean;
    blur: boolean;
    greyscale: boolean;
}

export interface TheSearchOptions {
    text: string;
}

export interface StarVsTheForcesOfOptions {
    avatar: string;
}

export interface SonicSaysOptions {
    text: string;
}

export interface ShitOptions {
    text: string;
    plural: boolean;
}

export interface RetardedOptions {
    text: string;
    avatar?: string;
}

export interface PixelateOptions {
    url: string;
    scale: number;
}

export interface PCCheckOptions {
    text: string;
}

export interface FreeOptions {
    top: string;
    bottom?: string;
}

export interface DistortOptions {
    avatar: string;
}

export interface DeleteOptions {
    text: string;
}

export interface ColorOptions {
    hex: number;
}

export interface ClydeOptions {
    text: string;
}

export interface ClippyOptions {
    text: string;
}

export interface ClintOptions {
    image: string;
}

export interface CaptionOptions {
    url: string;
    input: {
        top?: string;
        bottom?: string;
    };
    font: ValidFont;
}

export interface CAHOptions {
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
