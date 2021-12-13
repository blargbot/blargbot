import { MasterWorker } from './MasterWorker';

export interface MasterOptions {
    readonly avatars: readonly string[];
    readonly holidays: { readonly [key: string]: string; };
    readonly worker: MasterWorker;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type MasterIPCContract = {

}
