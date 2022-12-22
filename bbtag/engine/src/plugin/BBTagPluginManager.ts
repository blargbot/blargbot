import { BBTagPlugin } from './BBTagPlugin.js';
import type { BBTagPluginInstance } from './BBTagPluginInstance.js';
import type { BBTagPluginType } from './BBTagPluginType.js';

export class BBTagPluginManager {
    readonly #plugins: Map<BBTagPluginType, BBTagPluginInstance<BBTagPluginType>>;

    public constructor(plugins: Iterable<object>) {
        this.#plugins = new Map();

        for (const plugin of plugins) {
            const types = BBTagPlugin.getProviderTypes(plugin);
            if (types.length === 0)
                throw new Error(`Plugin ${String(plugin.constructor)} doesnt have any registered plugin types.`);
            for (const type of types)
                this.#plugins.set(type, plugin);
        }
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
