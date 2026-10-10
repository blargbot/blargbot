export function isInstanceOf<Class extends abstract new (...args: never) => unknown>(type: Class): (value: unknown) => value is InstanceType<Class> {
    return (value): value is InstanceType<Class> => value instanceof type;
}
