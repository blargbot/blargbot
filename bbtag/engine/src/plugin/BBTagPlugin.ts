import type { BBTagClosure } from '../closure/BBTagClosure.js';
import type { BBTagClosureValue } from '../closure/BBTagClosureValue.js';
import type { BBTagProcess } from '../runtime/BBTagProcess.js';
import type { BBTagPluginFactory } from './BBTagPluginFactory.js';
import type { BBTagPluginType } from './BBTagPluginType.js';

export abstract class BBTagPlugin {
    readonly #process: BBTagProcess;

    public static factory<Type extends BBTagPluginType>(type: Type): (target: BBTagPluginFactory<Type>) => void {
        return (factory) => {
            if (factory.type !== type)
                throw new Error(`Expected factory type to be ${String(type)} but got ${String(factory.type)}`);
        };
    }

    public static persistLocal(): <This extends BBTagPlugin & { [P in Prop]?: BBTagClosureValue }, Prop extends string>(target: This, property: Prop) => void {
        return this.persist(p => p.currentClosure);
    }

    public static persistScript(): <This extends BBTagPlugin & { [P in Prop]?: BBTagClosureValue }, Prop extends string>(target: This, property: Prop) => void {
        return this.persist(p => p.currentScript);
    }

    public static persistGlobal(): <This extends BBTagPlugin & { [P in Prop]?: BBTagClosureValue }, Prop extends string>(target: This, property: Prop) => void {
        return this.persist(p => p);
    }

    public static persist(getClosure: (process: BBTagProcess) => BBTagClosure): <This extends BBTagPlugin & { [P in Prop]?: BBTagClosureValue }, Prop extends string>(target: This, property: Prop) => void {
        return <This extends BBTagPlugin & { [P in Prop]?: BBTagClosureValue }, Prop extends string>(target: This, property: Prop) => {
            Object.defineProperty<object, string, BBTagClosureValue | undefined>(target, property, {
                get(this: This) {
                    return getClosure(this.#process).data.get(target, property);
                },
                set(this: This, value) {
                    if (value === undefined)
                        getClosure(this.#process).data.revert(target, property);
                    else
                        getClosure(this.#process).data.set(target, property, value);
                }
            });
        };
    }

    public constructor(process: BBTagProcess) {
        this.#process = process;
    }
}
