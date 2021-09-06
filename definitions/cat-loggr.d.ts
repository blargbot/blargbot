import { PreHookCallback } from 'cat-loggr/ts';

declare module 'cat-loggr/ts' {
    export default interface CatLoggr {
        addPreHook(func: PreHookCallback): this;
        // eslint-disable-next-line semi
    }
}
