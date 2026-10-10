import type { ImageResponse } from '@blargbot/contracts';
import type { CommandMap } from 'blargbot-image-api';
import type gm from 'gm';

import type { ValidFont } from './types.js';

export interface GeneratorContext {
    getRemote(url: string): Promise<Uint8Array>;
    getLocal(...path: readonly string[]): LocalFile;
    renderText(text: string, options: TextOptions): Promise<Uint8Array>;
    renderGif(frames: Iterable<Uint8Array>, options: GifOptions): Promise<Uint8Array>;
    gmConvert(source: Uint8Array, transform: (image: gm.State) => gm.State, format?: string): Promise<Uint8Array>;
    fetch: typeof fetch;

    renderApi<Type extends keyof CommandMap>(type: Type, data: CommandMap[Type]): Promise<ImageResponse>;
}

export interface TextOptions {
    readonly font: ValidFont;
    readonly fontsize?: number;
    readonly width: number;
    readonly height?: number;
    readonly fill?: string;
    readonly gravity?: gm.GravityDirection;
    readonly outline?: [color: string, width: number];
}

export interface LocalFile {
    readonly path: string;
    bytes(): Promise<Uint8Array>;
}

export interface GifOptions {
    readonly width: number;
    readonly height: number;
    readonly delay?: number;
    readonly quality?: number;
    readonly repeat?: number;
}
