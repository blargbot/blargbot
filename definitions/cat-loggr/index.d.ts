import { PreHookCallback } from 'cat-loggr/ts';

export module 'cat-loggr/ts' {
    export default interface CatLoggr {
        addPreHook(func: PreHookCallback): this;
        // eslint-disable-next-line semi
    }
}
