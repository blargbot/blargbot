import { MasterWorker } from './MasterWorker';

export interface MasterOptions {
    readonly avatars: readonly string[];
    readonly worker: MasterWorker;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type MasterIPCContract = {

}
