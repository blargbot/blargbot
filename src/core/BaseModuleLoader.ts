import path from 'path';
import { promises as fs } from 'fs';
import { EventEmitter } from 'eventemitter3';
import { MultiKeyMap } from '../structures/MultiKeyMap';
import reloadFactory from 'require-reload';
import { guard } from '../newbu';

const reload = reloadFactory(require);

export type ModuleResult<TModule> = { names: Iterable<string>, module: TModule };

export abstract class BaseModuleLoader<TModule> extends EventEmitter {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #root: string;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #modules: MultiKeyMap<string, TModule>;

    public constructor(
        public readonly source: string,
        public readonly logger: CatLogger
    ) {
        super();
        this.#root = getAbsolutePath(source);
        this.#modules = new MultiKeyMap<string, TModule>();

        this.#modules.on('add', (...args: unknown[]) => this.emit('add', ...args));
        this.#modules.on('remove', (...args: unknown[]) => this.emit('remove', ...args));
        this.#modules.on('link', (...args: unknown[]) => this.emit('link', ...args));
        this.#modules.on('unlink', (...args: unknown[]) => this.emit('unlink', ...args));
    }

    public list(): IterableIterator<TModule> {
        return this.#modules.values();
    }

    public get(name: string): TModule | undefined {
        return this.#modules.get(name);
    }

    public async init(): Promise<void> {
        let fileNames = await fs.readdir(this.#root);
        fileNames = fileNames.filter(fileName => /\.js$/.test(fileName));
        this.load(fileNames);
    }

    private load(fileNames: Iterable<string>, loader = require): void {
        for (const fileName of fileNames) {
            try {
                const rawModule = loader(path.join(this.#root, fileName));
                const modules = this.activate(fileName, rawModule);
                for (const { names, module } of modules)
                    for (const name of names)
                        this.#modules.set(name, module);
            } catch (err) {
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


    public reload(fileNames: Iterable<string>): void {
        this.load(fileNames, reload);
    }

    protected activate(fileName: string, rawModule: unknown): Array<ModuleResult<TModule>> {
        switch (typeof rawModule) {
            case 'function':
            case 'object':
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
        this.logger.debug(`No modules found in ${fileName}`);
        return [];
    }

    protected abstract tryActivate(rawModule: unknown): ModuleResult<TModule> | null;
}

function getAbsolutePath(...segments: string[]): string {
    const result = path.join(...segments);
    if (path.isAbsolute(result))
        return result;
    return path.join(__dirname, '..', result);
}