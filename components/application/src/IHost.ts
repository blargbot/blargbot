export type HostState = 'stopped' | 'starting' | 'running' | 'stopping'

export interface IHost {
    get state(): HostState;
    run(): Promise<void>;
    shutdown(): Promise<void>;
}
