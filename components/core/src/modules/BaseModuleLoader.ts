import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MultiKeyMap } from '@blargbot/core/MultiKeyMap.js';
import { ModuleResult } from '@blargbot/core/types.js';
import { guard, pluralise as p } from '@blargbot/core/utils/index.js';
import { Logger } from '@blargbot/logger';
import { EventEmitter } from 'eventemitter3';

interface ModuleLoaderEvents<TModule> {
    add: [module: TModule];
    remove: [module: TModule];
    unlink: [module: TModule, key: string];
    link: [module: TModule, key: string];
}

export abstract class BaseModuleLoader<TModule> extends EventEmitter<ModuleLoaderEvents<TModule>> {
    readonly #root: string;
    readonly #modules: MultiKeyMap<string, { module: TModule; location: string; }>;

    public get size(): number { return this.#modules.size; }

    public constructor(
        public readonly context: ImportMeta,
        public readonly path: string,
        public readonly logger: Logger
    ) {
        super();
        this.#root = getAbsolutePath(context, path);
        this.#modules = new MultiKeyMap<string, { module: TModule; location: string; }>();

        this.#modules.on('add', ({ module }) => this.emit('add', module));
        this.#modules.on('remove', ({ module }) => this.emit('remove', module));
        this.#modules.on('link', ({ module }, key) => this.emit('link', module, key));
        this.#modules.on('unlink', ({ module }, key) => this.emit('unlink', module, key));
    }

    public list(): Generator<TModule>;
    public list(filter: (module: TModule) => boolean): Generator<TModule>
    public * list(filter?: (module: TModule) => boolean): Generator<TModule> {
        filter ??= () => true;
        for (const module of this.#modules.values()) {
            if (filter(module.module)) {
                yield module.module;
            }
        }
    }

    public get(name: string): TModule | undefined {
        return this.#modules.get(name)?.module;
    }

    public async init(): Promise<void> {
        await this.#load(await toArray(this.#findFiles()));
    }

    async #load(fileNames: Iterable<string>): Promise<void> {
        const loaded = new Set<TModule>();
        if (typeof fileNames === 'string')
            fileNames = [fileNames];

        for (const fileName of fileNames) {
            try {
                const rawModule = await import(path.join(this.#root, fileName)) as unknown;
                const modules = this.activate(fileName, rawModule);
                for (const { names, module } of modules) {
                    const entry = { module, location: fileName };
                    for (const name of names) {
                        loaded.add(module);
                        this.#modules.set(name, entry);
                    }
                }
            } catch (err: unknown) {
                if (err instanceof Error)
                    this.logger.error(err.stack);
                this.logger.module(this.path, 'Error while loading module', fileName);
            }
        }

        this.logger.init(`Loaded ${loaded.size} ${p(loaded.size, 'module')} from ${this.#root}`);
    }

    public foreach(action: (module: TModule) => void): void;
    public foreach(action: (module: TModule) => Promise<void>): Promise<void>;
    public foreach(action: (module: TModule) => void | Promise<void>): Promise<void> | void {
        const results: Array<PromiseLike<void>> = [];
        for (const module of this.#modules.values()) {
            const result = action(module.module);
            if (isPromiseLike(result))
                results.push(result);
        }
        if (results.length > 0)
            return Promise.all(results).then(x => void x);
    }

    public async reload(rediscover = false): Promise<void> {
        const sources = rediscover ? toArray(this.#findFiles()) : this.sources();
        await this.#load(await sources);
    }

    public source(module: string): string | undefined;
    public source(modules: Iterable<string>): Iterable<string>;
    public source(modules: string | Iterable<string>): string | Iterable<string> | undefined {
        if (typeof modules === 'string')
            return this.#modules.get(modules)?.location;

        return mapIter(modules, m => this.#modules.get(m)?.location, guard.hasValue);
    }

    public * sources(): Iterable<string> {
        for (const { location } of this.#modules.values())
            yield location;
    }

    protected activate(fileName: string, rawModule: unknown): Array<ModuleResult<TModule>> {
        switch (typeof rawModule) {
            case 'function':
            case 'object': {
                if (!guard.hasValue(rawModule))
                    break;
                const result = this.tryActivate(rawModule, fileName);
                if (guard.hasValue(result))
                    return [result];
                const values = Object.values(rawModule)
                    .map(m => this.tryActivate(m, fileName))
                    .filter(guard.hasValue);
                if (values.length > 0)
                    return values;
            }
        }
        this.logger.debug(`No modules found in ${fileName}`);
        return [];
    }

    protected abstract tryActivate(rawModule: unknown, fileName: string): ModuleResult<TModule> | undefined;

    async * #findFiles(): AsyncGenerator<string> {
        const directories = [this.#root];
        let dir;
        while ((dir = directories.shift()) !== undefined) {
            const items = await fs.readdir(dir);
            for (const item of items) {
                const location = path.join(dir, item);
                if ((await fs.stat(location)).isDirectory())
                    directories.push(location);
                else if (item.endsWith('.js'))
                    yield location.replace(this.#root, '');
            }
        }
    }
}

function getAbsolutePath(context: ImportMeta, ...segments: string[]): string {
    segments.unshift(path.dirname(fileURLToPath(context.url)));
    const result = path.join(...segments);
    if (path.isAbsolute(result))
        return result;
    return path.join(__dirname, '..', result);
}

function isPromiseLike<T>(value: T | PromiseLike<T>): value is PromiseLike<T> {
    return typeof value === 'object' && value !== null && 'then' in value && typeof value.then === 'function';
}

async function toArray<T>(source: AsyncIterable<T>): Promise<T[]> {
    const result = [];
    for await (const item of source)
        result.push(item);
    return result;
}

function* mapIter<T, I, R extends I>(source: Iterable<T>, mapping: (value: T, index: number) => I, check: (value: I) => value is R): Generator<R> {
    let i = 0;
    for (const item of source) {
        const val = mapping(item, i++);
        if (check(val))
            yield val;
    }
}
