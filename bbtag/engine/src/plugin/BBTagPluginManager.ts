import type { BBTagProcess } from '../runtime/BBTagProcess.js';
import type { BBTagPlugin } from './BBTagPlugin.js';
import type { BBTagPluginFactory } from './BBTagPluginFactory.js';
import type { BBTagPluginInstance } from './BBTagPluginInstance.js';
import type { BBTagPluginType } from './BBTagPluginType.js';

export class BBTagPluginManager {
    readonly #plugins: Map<BBTagPluginType, BBTagPlugin>;

    public constructor(process: BBTagProcess, plugins: Iterable<BBTagPluginFactory>) {
        this.#plugins = new Map();

        for (const plugin of plugins)
            this.#plugins.set(plugin.type, plugin.createPlugin(process));
    }

    public has<Type extends BBTagPluginType>(type: Type): boolean {
        return this.#plugins.has(type);
    }

    public get<Type extends BBTagPluginType>(type: Type): BBTagPluginInstance<Type> {
        const result = this.tryGet(type);
        if (result === undefined)
            throw new Error(`Unknown plugin ${type.toString()}`);
        return result;
    }

    public tryGet<Type extends BBTagPluginType>(type: Type): BBTagPluginInstance<Type> | undefined
    public tryGet(type: BBTagPluginType): BBTagPluginInstance<BBTagPluginType> | undefined {
        return this.#plugins.get(type);
    }
}
