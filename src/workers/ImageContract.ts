import { WorkerContract } from './core/Contract';

export interface ImageContract extends WorkerContract {
    'img': [string | null, { command: string }];
}