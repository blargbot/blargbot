export interface AbstractDecorator extends ClassDecorator {
    sealed: MethodDecorator;
}

const sealedMap = new Map<unknown, Set<PropertyKey>>();
const abstractMap = new Map<unknown, Set<PropertyKey>>();

// eslint-disable-next-line @typescript-eslint/ban-types
function abstractDecorator<T extends Function>(target: T): T;
function abstractDecorator(target: new (...args: unknown[]) => object): new (...args: unknown[]) => object {
    const wrapper = {
        [target.name]: class extends target {
            public constructor(...args: unknown[]) {
                super(...args);
                if (this.constructor === wrapper[target.name])
                    throw new Error(`${target.name} is abstract and cannot be directly constructed`);

                const proto = target.prototype as Partial<typeof this>;
                const sealed = sealedMap.get(proto);
                for (const key of sealed ?? []) {
                    // @ts-expect-error it doesnt matter if the key doesnt exist as that correctly would cause an error
                    if (this[key] !== proto[key])
                        throw new Error(`Member '${key.toString()}' is sealed on ${target.name} and cannot be overridden!`);
                }

                const abstract = abstractMap.get(proto);
                for (const key of abstract ?? []) {
                    // @ts-expect-error it doesnt matter if the key doesnt exist as that correctly would cause an error
                    if (this[key] !== proto[key])
                        throw new Error(`Member '${key.toString()}' is abstract on ${target.name} and must be overridden!`);
                }
            }
        }
    };

    return wrapper[target.name];
}
function sealedDecorator<T>(this: void, target: object, key: PropertyKey, descriptor: TypedPropertyDescriptor<T>): void {
    descriptor.configurable = false;
    descriptor.writable = false;
    let sealed = sealedMap.get(target);
    if (sealed === undefined)
        sealedMap.set(target, sealed = new Set());

    sealed.add(key);
}

export const abstract: AbstractDecorator = Object.defineProperties(
    abstractDecorator,
    {
        'sealed': { value: sealedDecorator }
    }
);
