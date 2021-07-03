import path from 'path';
import { promises as fs } from 'fs';
import { EventEmitter } from 'eventemitter3';
import reloadFactory from 'require-reload';
import { ModuleResult } from './types';
import { MultiKeyMap } from './MultiKeyMap';
import { guard } from './utils';
import { Logger } from './Logger';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const reload = reloadFactory(require);

export abstract class BaseModuleLoader<TModule> extends EventEmitter {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #root: string;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #modules: MultiKeyMap<string, TModule>;

    public constructor(
        public readonly source: string,
        public readonly logger: Logger
    ) {
        super();
        this.#root = getAbsolutePath(source);
        this.#modules = new MultiKeyMap<string, TModule>();

        this.#modules.on('add', (...args: unknown[]) => this.emit('add', ...args));
        this.#modules.on('remove', (...args: unknown[]) => this.emit('remove', ...args));
        this.#modules.on('link', (...args: unknown[]) => this.emit('link', ...args));
        this.#modules.on('unlink', (...args: unknown[]) => this.emit('unlink', ...args));
    }
    public list(): Generator<TModule>;
    public list(filter: (module: TModule) => boolean): Generator<TModule>
    public * list(filter?: (module: TModule) => boolean): Generator<TModule> {
        filter ??= () => true;
        for (const module of this.#modules.values()) {
            if (filter(module)) {
                yield module;
            }
        }
    }

    public get(name: string): TModule | undefined;
    public get<T extends TModule>(name: string, type: ClassOf<T>): T | undefined;
    public get(name: string, type?: ClassOf<unknown>): TModule | undefined {
        const result = this.#modules.get(name);
        if (type === undefined || result === undefined)
            return result;
        return typeof result === 'object'
            && result !== null
            && result instanceof type
            ? result
            : undefined;
    }

    public async init(): Promise<void> {
        this.load(await this.findFiles());
    }

    private load(fileNames: Iterable<string>, loader = require): void {
        for (const fileName of fileNames) {
            try {
                const rawModule = loader(path.join(this.#root, fileName)) as unknown;
                const modules = this.activate(fileName, rawModule);
                for (const { names, module } of modules)
                    for (const name of names)
                        this.#modules.set(name, module);
            } catch (err: unknown) {
                if (err instanceof Error)
                    this.logger.error(err.stack);
                this.logger.module(this.source, 'Error while loading module', fileName);
            }
        }
    }

    public foreach(action: (module: TModule) => void): void;
    public foreach(action: (module: TModule) => Promise<void>): Promise<void>;
    public foreach(action: (module: TModule) => void | Promise<void>): Promise<void> | void {
        const results = [];
        for (const module of this.#modules.values()) {
            const result = action(module);
            if (result !== undefined)
                results.push(result);
        }
        if (results.length > 0)
            return Promise.all(results).then(x => void x);
    }


    public reload(): Promise<void>
    public reload(fileNames: Iterable<string>): void
    public reload(fileNames?: Iterable<string>): void | Promise<void> {
        if (fileNames === undefined) {
            return this.findFiles().then(files => this.load(files, reload));
        }
        this.load(fileNames, reload);
    }

    protected activate(fileName: string, rawModule: unknown): Array<ModuleResult<TModule>> {
        switch (typeof rawModule) {
            case 'function':
            case 'object': {
                if (rawModule === null)
                    break;
                const result = this.tryActivate(rawModule);
                if (result !== null)
                    return [result];
                const values = Object.values(rawModule)
                    .map(m => this.tryActivate(m))
                    .filter(guard.hasValue);
                if (values.length > 0)
                    return values;
            }
        }
        this.logger.debug(`No modules found in ${fileName}`);
        return [];
    }

    protected abstract tryActivate(rawModule: unknown): ModuleResult<TModule> | null;

    private async findFiles(): Promise<Iterable<string>> {
        const fileNames = await fs.readdir(this.#root);
        return fileNames.filter(n => n.endsWith('.js'));
    }
}

function getAbsolutePath(...segments: string[]): string {
    const result = path.join(...segments);
    if (path.isAbsolute(result))
        return result;
    return path.join(__dirname, '..', result);
}