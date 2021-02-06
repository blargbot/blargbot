import { PostHookCallback } from 'cat-loggr/ts';

declare module 'cat-loggr/ts' {
    export type PostHookEvent = (...args: Parameters<PostHookCallback>) => void;

    class CatLoggr {
        addPostHook(func: PostHookEvent): this;
    }
}