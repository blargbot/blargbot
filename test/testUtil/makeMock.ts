import { instance, mock, when } from 'ts-mockito';

export function makeMock<T extends object>(type: new (...args: never) => T, props: Partial<T>): T {
    const m = mock<T>(type);
    for (const [key, value] of Object.entries(props))
        when(m[key as keyof T]).thenReturn(value as T[keyof T]);
    return instance(m);
}
