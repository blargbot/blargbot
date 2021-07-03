export function hasProperty<T>(value: T, name: PropertyKey): name is keyof T {
    return Object.prototype.hasOwnProperty.call(value, name);
}