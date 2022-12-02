import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
interface IResource<T> {
    readonly location: string;
    load(): Promise<T>;
    reload(): Promise<T>;
}

export function getJsonResource<T>(name: string): IResource<T> {
    return getResouce(name, v => JSON.parse(v.toString()) as T);
}

export function getFileResource(name: string): IResource<Buffer> {
    return getResouce(name, v => v);
}

export function getResouce<T>(name: string, reader: (data: Buffer) => Awaitable<T>): IResource<T> {
    let current: Promise<T> | undefined;
    const location = path.join(root, name);
    async function load(): Promise<T> {
        const data = await fs.readFile(location);
        return await reader(data);
    }

    return {
        location,
        load() {
            return current ??= load();
        },
        reload() {
            return current = load();
        }
    };
}
