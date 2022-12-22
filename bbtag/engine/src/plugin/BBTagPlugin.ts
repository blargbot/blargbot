import type { BBTagClosure } from '../closure/BBTagClosure.js';
import type { BBTagClosureValue } from '../closure/BBTagClosureValue.js';
import type { BBTagProcess } from '../runtime/BBTagProcess.js';
import type { BBTagPluginType } from './BBTagPluginType.js';

const pluginProviderList: unique symbol = Symbol('PluginProviderList');
const pluginProcess: unique symbol = Symbol('PluginProcess');

export abstract class BBTagPlugin {
    public static provides<Type>(type: BBTagPluginType<Type>): <Args extends readonly unknown[]>(target: new (...args: Args) => Type) => void {
        return plugin => {
            const ctor = plugin.constructor as { [pluginProviderList]?: BBTagPluginType[]; };
            let providerList = ctor[pluginProviderList];
            if (providerList === undefined) {
                Object.defineProperty(ctor, pluginProviderList, {
                    configurable: false,
                    enumerable: false,
                    writable: false,
                    value: providerList = []
                });
            }
            providerList.push(type);
        };
    }

    public static getProviderTypes(plugin: object): readonly BBTagPluginType[] {
        const ctor = plugin.constructor as { [pluginProviderList]?: BBTagPluginType[]; };
        return [...ctor[pluginProviderList] ?? []];
    }

    public static persistLocal(): <This extends { [P in Prop]?: BBTagClosureValue }, Prop extends string>(target: This, property: Prop) => void {
        return this.persist(p => p.currentClosure);
    }

    public static persistScript(): <This extends { [P in Prop]?: BBTagClosureValue }, Prop extends string>(target: This, property: Prop) => void {
        return this.persist(p => p.currentScript);
    }

    public static persistGlobal(): <This extends { [P in Prop]?: BBTagClosureValue }, Prop extends string>(target: This, property: Prop) => void {
        return this.persist(p => p);
    }

    public static persist(getClosure: (process: BBTagProcess) => BBTagClosure): <This extends { [P in Prop]?: BBTagClosureValue }, Prop extends string>(target: This, property: Prop) => void {
        return <This extends { [P in Prop]?: BBTagClosureValue }, Prop extends string>(target: This, property: Prop) => {
            Object.defineProperty<object, string, BBTagClosureValue | undefined>(target, property, {
                get(this: This) {
                    return getClosure(BBTagPlugin.#getProcess(this)).data.get(target, property);
                },
                set(this: This, value) {
                    if (value === undefined)
                        getClosure(BBTagPlugin.#getProcess(this)).data.revert(target, property);
                    else
                        getClosure(BBTagPlugin.#getProcess(this)).data.set(target, property, value);
                }
            });
        };
    }

    static #getProcess(plugin: object): BBTagProcess {
        const process = (plugin as { [pluginProcess]?: BBTagProcess; })[pluginProcess];
        if (process === undefined)
            throw new Error('No process has been set for the plugin');
        return process;
    }

    public static setProcess(plugin: object, process: BBTagProcess): void {
        Object.defineProperty(plugin, pluginProcess, {
            configurable: false,
            enumerable: false,
            writable: false,
            value: process
        });
    }

    private constructor(..._args: never) {
        _args;
        throw new Error('BBTagPlugin is a static class');
    }
}
