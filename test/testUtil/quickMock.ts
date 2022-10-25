import { instance, when } from 'ts-mockito';
import { Mocker } from 'ts-mockito/lib/Mock';

export function quickMock<T extends object>(factory: () => T, props: Partial<T>): T {
    const target = factory();
    const mocker = new Mocker(target.constructor, target);
    const m = mocker.getMock() as T;
    for (const [key, value] of Object.entries(props))
        when(m[key as keyof T]).thenReturn(value as T[keyof T]);
    return instance(m);
}
