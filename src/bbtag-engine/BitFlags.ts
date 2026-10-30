export function defineBitFlags<Name extends string | symbol>(
    options: Record<Name, number>
): BitFlagsConstructor<number, Name>;
export function defineBitFlags<Name extends string | symbol>(
    options: Record<Name, bigint>
): BitFlagsConstructor<bigint, Name>;
export function defineBitFlags<Flag extends number | bigint, Name extends string | symbol>(
    options: Record<Name, Flag>
): BitFlagsConstructor<Flag, Name> {
    const mapping = new Map<Name, Flag>(Reflect.ownKeys(options).map(k => [k as Name, options[k as Name]]));
    const first = mapping.values().next();
    if (first.done === true)
        throw new Error('Cannot have an empty bit set');
    const zero = xor(first.value, first.value);
    if (mapping.values().some(v => typeof v !== typeof zero))
        throw new Error('Cannot mix number and bigint flags.');
    if (mapping.values().some(v => not(not(v)) !== v)) // Bigints intentionally never fail this check.
        throw new Error('Flags must be 32 bit signed integers.');
    if (mapping.values().some(v => v !== zero && !hasOneBitSet(v, zero)))
        throw new Error('Flags must each represent a single bit.');
    if (new Set(mapping.values()).size !== mapping.size)
        throw new Error('Each bit pattern may only be represented by one flag name.');
    const none = mapping.entries().find(v => v[1] === zero)?.[0];

    const knownBits = mapping.values().reduce(or);

    function getOrThrow(value: Name): Flag {
        const result = mapping.get(value);
        if (result === undefined)
            throw new Error(`Unknown flag ${String(value)}`);
        return result;
    }
    function toFlag(values: Array<BitFlagConvertible<Flag, Name>>): Flag {
        return values.values().map(value => {
            if (typeof value === typeof zero)
                return value as typeof zero;
            if (typeof value === 'string' || typeof value === 'symbol')
                return getOrThrow(value);
            if (typeof value === 'object' && Symbol.toPrimitive in value) {
                const other = value[Symbol.toPrimitive]();
                if (typeof other === typeof zero)
                    return other;
            }
            throw new Error(`Value ${String(value)} is not a valid flag.`);
        }).reduce(or, zero);
    }
    let subclass: BitFlagsConstructor<Flag, Name> | undefined;
    function assertSubclass(impl: BitFlagsConstructor<Flag, Name>): void {
        if (impl !== BitFlags)
            subclass ??= impl;
        if (subclass !== impl)
            throw new Error('BitFlags must have exactly one subclass.');
    }

    class BitFlags implements IType<Flag, Name> {
        declare public readonly raw: Flag;

        public constructor(...flags: Array<BitFlagConvertible<Flag, Name>>) {
            assertSubclass(new.target);
            Reflect.defineProperty(this, 'raw', {
                configurable: false,
                enumerable: true,
                writable: false,
                value: toFlag(flags)
            });
        }
        public is(...flags: Array<BitFlagConvertible<Flag, Name>>): boolean {
            const f = toFlag(flags);
            return this.raw === f;
        }
        public has(...flags: Array<BitFlagConvertible<Flag, Name>>): boolean {
            const f = toFlag(flags);
            return and(this.raw, f) === f;
        }
        public hasAny(...flags: Array<BitFlagConvertible<Flag, Name>>): boolean {
            const f = toFlag(flags);
            return and(this.raw, f) !== zero;
        }
        public or(...flags: Array<BitFlagConvertible<Flag, Name>>): this {
            const f = toFlag(flags);
            return this.#from(or(this.raw, f));
        }
        public and(...flags: Array<BitFlagConvertible<Flag, Name>>): this {
            const f = toFlag(flags);
            return this.#from(and(this.raw, f));
        }
        public xor(...flags: Array<BitFlagConvertible<Flag, Name>>): this {
            const f = toFlag(flags);
            return this.#from(xor(this.raw, f));
        }
        public inverse(): this {
            return this.#from(not(this.raw));
        }
        * #iterateNames(): Generator<Name, void, void> {
            if (this.raw === zero) {
                if (none !== undefined)
                    yield none;
                return;
            }
            for (const [name, value] of mapping)
                if (value !== zero && and(this.raw, value) === value)
                    yield name;
        }
        public toArray(): Name[] {
            return [...this.#iterateNames()];
        }
        public toSet(): Set<Name> {
            return new Set(this.#iterateNames());
        }
        public toJSON(): Flag extends bigint ? string : Flag {
            const result = typeof this.raw === 'bigint'
                ? this.raw.toString()
                : this.raw;
            return result as Flag extends bigint ? string : Flag;
        }
        public normalize(): this {
            if (!this.hasExtra())
                return this;
            return this.#from(and(this.raw, knownBits));
        }
        #from(value: Flag): this {
            return new subclass!(value) as this;
        }
        public hasExtra(): boolean {
            return and(this.raw, not(knownBits)) !== zero;
        }
        public toString(radix?: number): string {
            if (radix !== undefined)
                return this.raw.toString(radix);

            let remain = this.raw;
            if (remain === zero)
                return String(none ?? '0');

            const results = [];
            for (const [name, flag] of mapping) {
                if (flag !== zero && and(remain, flag) === flag) {
                    results.push(name);
                    remain = xor(remain, flag);
                }
            }
            if (remain !== zero)
                results.push(remain);

            return results.join(' | ');
        }
        public [Symbol.toPrimitive](): Flag {
            return this.raw;
        }
    };
    names.set(BitFlags, [...mapping.keys()]);
    Object.freeze(BitFlags);
    Object.freeze(BitFlags.prototype);
    return BitFlags;
}

const names = new WeakMap<object, ReadonlyArray<string | symbol> | false>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defineBitFlagConstants<T extends BitFlagsConstructor<any, any>>(cls: T): T & BitFlagConstants<InstanceType<T>> {
    for (
        let current: object | null = cls;
        current !== null;
        current = Reflect.getPrototypeOf(current)
    ) {
        const mapping = names.get(current);
        if (mapping === false) {
            if (current === cls)
                return cls;
            throw new Error('BitFlags must have exactly one subclass.');
        }
        if (mapping !== undefined) {
            for (const name of mapping) {
                if (name in cls)
                    throw new Error(`Bit flag name ${String(name)} collides with a built in member. Please rename it`);
            }
            for (const name of mapping) {
                Reflect.defineProperty(cls, name, {
                    configurable: false,
                    enumerable: true,
                    writable: false,
                    value: new cls(name)
                });
            }
            names.set(cls, false); // Make this atomic and skip redefining if called again.
            return cls;
        }
    }
    throw new Error('Value is not a bitflag');
}

function or<T extends number | bigint>(a: T, b: T): T {
    return (a | b) as T;
}
function xor<T extends number | bigint>(a: T, b: T): T {
    return (a ^ b) as T;
}
function and<T extends number | bigint>(a: T, b: T): T {
    return (a & b) as T;
}
function not<T extends number | bigint>(a: T): T {
    return ~a as T;
}
function neg<T extends number | bigint>(a: T): T {
    return -a as T;
}
function hasOneBitSet<T extends number | bigint>(v: T, zero: T): boolean {
    return v !== zero && and(v, neg(v)) === v;
}

type IType<Flag extends number | bigint, Name extends string | symbol = string | symbol> = BitFlags<Flag, Name>;
type BitFlagConvertible<Flag extends number | bigint, Name extends string | symbol> = Flag | Name | { [Symbol.toPrimitive](): Flag; };
export type BitFlagsConstructor<Flag extends number | bigint, Name extends string | symbol = string | symbol> = {
    new(...values: Array<BitFlagConvertible<Flag, Name>>): BitFlags<Flag, Name>;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BitFlagConstants<Self extends BitFlags<any, any>> = { readonly [P in BitFlagNames<Self>]: Self; }
export interface BitFlags<Flag extends number | bigint, Name extends string | symbol = never> {
    get raw(): Flag;
    is(...flags: Array<BitFlagConvertible<Flag, Name>>): boolean;
    has(...flags: Array<BitFlagConvertible<Flag, Name>>): boolean;
    hasAny(...flag: Array<BitFlagConvertible<Flag, Name>>): boolean;
    or(...flags: Array<BitFlagConvertible<Flag, Name>>): this;
    and(...flags: Array<BitFlagConvertible<Flag, Name>>): this;
    xor(...flags: Array<BitFlagConvertible<Flag, Name>>): this;
    inverse(): this;
    [Symbol.toPrimitive](): Flag;
    toArray(): Name[];
    toJSON(): Flag extends bigint ? string : Flag;
    toSet(): Set<Name>;
    normalize(): this;
    hasExtra(): boolean;
    toString(radix?: number): string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BitFlagNames<T extends BitFlags<any, any>> = T extends BitFlags<infer _, infer Name> ? Name : never;
