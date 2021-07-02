import gm from 'gm';
import Jimp from 'jimp';

export type MagickSource = string | Jimp | Buffer | gm.State | [width: number, height: number, color?: string];

export interface TextOptions {
    font?: string;
    fontsize?: number;
    size?: string;
    fill?: string;
    gravity?: string;
    stroke?: string;
    strokewidth?: string
}

export interface PhantomOptions {
    replacements?: { [elementId: string]: string },
    scale?: number;
    format?: string;
}

export interface PhantomTransformOptions<T> extends PhantomOptions {
    transform: (arg: T) => void;
    transformArg: T;
}

export interface JimpGifEncoderOptions {
    width: number,
    height: number,
    repeat?: number,
    quality?: number,
    delay?: number
}