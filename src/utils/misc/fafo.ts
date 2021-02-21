
export function fafo<TArgs extends unknown[]>(handler: (...args: TArgs) => Promise<unknown>): (...args: TArgs) => void {
    return (...args) => void handler(...args);
}
