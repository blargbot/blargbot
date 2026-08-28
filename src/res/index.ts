import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import type $devAvatars from './avatars.dev.json';
import type $prdAvatars from './avatars.prd.json';
import type $beemovie from './beemovie.json';
import type $cah from './cah.json';
import type $colors from './colors.json';
import type $contributors from './contributors.json';
import type $discordEmoteData from './discordEmoteData.json';
import type $holidays from './holidays.json';
import type $spells from './spells.json';

class Resource<T> {
    readonly #path: string;
    readonly #reviver: (buffer: ArrayBuffer) => Awaitable<T>;
    #state: undefined | { value: T; };

    public get data(): T {
        if (this.#state === undefined)
            throw new Error('Data is not loaded');

        return this.#state.value;
    }

    public constructor(file: string, reviver: (buffer: ArrayBuffer) => Awaitable<T>) {
        this.#path = path.resolve(`${import.meta.dirname}/${file}`);
        if (!existsSync(this.#path))
            throw new Error(`Cannot locate file ${file}. Relative paths are resolved with respect to ${import.meta.dirname}`);
        this.#reviver = reviver;
    }

    public async ensureLoaded(): Promise<void> {
        if (this.#state === undefined)
            await this.reload();
    }

    public async reload(): Promise<void> {
        const buffer = await fs.readFile(this.#path);
        this.#state = { value: await this.#reviver(buffer) };
    }
}
function asJson<T>(value: ArrayBuffer): T {
    return JSON.parse(Buffer.from(value).toString()) as T;
}

export const resourceDirectory = import.meta.dirname;
export const devAvatars = new Resource<typeof $devAvatars>('./avatars.dev.json', asJson);
export const prdAvatars = new Resource<typeof $prdAvatars>('./avatars.prd.json', asJson);
export const beemovie = new Resource<typeof $beemovie>('./beemovie.json', asJson);
export const cah = new Resource<typeof $cah>('./cah.json', asJson);
export const colors = new Resource<typeof $colors>('./colors.json', asJson);
export const contributors = new Resource<typeof $contributors>('./contributors.json', asJson);
export const discordEmoteData = new Resource<typeof $discordEmoteData>('./discordEmoteData.json', asJson);
export const holidays = new Resource<typeof $holidays>('./holidays.json', asJson);
export const spells = new Resource<typeof $spells>('./spells.json', asJson);
