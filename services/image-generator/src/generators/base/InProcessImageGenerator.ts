import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { getCallerImportMeta } from '@blargbot/application';
import type { ValidFont } from '@blargbot/image-generator-client';
import gm from 'gm';
import fetch from 'node-fetch';
import sharp from 'sharp';

import ImageGenerator from './ImageGenerator.js';

const emptyBuffer = Buffer.from([]);

export default abstract class InProcessImageGenerator<Options> extends ImageGenerator<Options> {
    protected readonly imageMagick = gm.subClass({ imageMagick: true });

    protected getRemoteImage(url: string, transform?: (value: sharp.Sharp) => Buffer): Promise<Blob>
    protected getRemoteImage<T>(url: string, transform: (value: sharp.Sharp) => Awaitable<T>): Promise<T>
    protected async getRemoteImage(url: string, transform?: (value: sharp.Sharp) => unknown): Promise<unknown> {
        const response = await this.getRemote(url, /^image\/?/);
        if (transform === undefined)
            return response;

        const raw = Buffer.from(await response.arrayBuffer());
        return transform(sharp(raw));
    }

    protected async getRemote(url: string, type?: RegExp): Promise<Blob> {
        url = url.trim();
        if (url.startsWith('<') && url.endsWith('>')) {
            url = url.substring(1, url.length - 1);
        }

        console.debug('Fetching remote data', url);
        const response = await fetch(url);
        if (!response.ok)
            throw new Error(`Failed to get content, received ${response.status}`);

        const result = await response.blob();
        if (type?.test(result.type) === false)
            throw new Error(`Expected content type to match ${type.toString()} but got ${result.type}`);

        return result;
    }

    protected getLocalImage(name: string): LocalResource {
        return this.getLocal(`../../images/${name}`, import.meta);
    }

    protected getLocalFont(name: string): LocalResource {
        return this.getLocal(`../../font/${name}.ttf`, import.meta);
    }

    protected getLocal(name: string, meta = getCallerImportMeta()): LocalResource {
        const caller = fileURLToPath(meta.url);
        return new LocalResource(path.join(path.dirname(caller), name));
    }

    protected async getText(text: string, options: TextOptions): Promise<Buffer> {
        // TODO: use sharp?
        const caption = `caption:${text.replaceAll(/[\\%@]/g, m => `\\${m}`)}`;
        const state = this.imageMagick(emptyBuffer)
            .command('convert')
            .out('-size', `${options.width}x${options.height ?? ''}`)
            .font(this.getLocalFont(`${options.font}.ttf`).path, options.fontsize)
            .background('transparent')
            .fill('black')
            .gravity(options.gravity ?? 'Center')
            .stroke(options.outline?.[0] ?? 'none')
            .strokeWidth((options.outline?.[1] ?? 1) * 2)
            .out(caption) // write text with stroke
            .compose('xor')
            .stroke('none')
            .out(caption, '-composite') // remove text and half of the stroke
            .compose('over')
            .fill(options.fill ?? 'black')
            .out(caption, '-composite'); // write text again, filling in removed region
        return await this.magickToBuffer(state, options.format);
    }

    protected async magickToBuffer(state: gm.State, format: string): Promise<Buffer> {
        return await promisify<Buffer>(cb => state.toBuffer(format, cb))();
    }
}

export class LocalResource {
    #content?: Promise<Buffer>;

    public readonly path: string;

    public constructor(path: string) {
        this.path = path;
    }

    public load(): Promise<Buffer> {
        return this.#content ??= fs.readFile(this.path);
    }

    public reload(): Promise<Buffer> {
        this.clear();
        return this.load();
    }

    public clear(): void {
        this.#content = undefined;
    }
}

export interface TextOptions {
    readonly format: string;
    readonly font: ValidFont;
    readonly fontsize?: number;
    readonly width: number;
    readonly height?: number;
    readonly fill?: string;
    readonly gravity?: gm.GravityDirection;
    readonly outline?: [color: string, width: number];
}
