export async function sleep(ms: number): Promise<undefined>
export async function sleep<T>(ms: number, result: T): Promise<T>
export async function sleep<T>(ms: number, result?: T): Promise<T | undefined> {
    return await new Promise<T | undefined>(resolve => setTimeout(resolve, ms, result));
}
