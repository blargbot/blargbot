import type { DiscordGatewayIPCMessageBroker } from '../DiscordGatewayIPCMessageBroker.js';
import { GatewayWorker } from './GatewayWorker.js';

export class GatewayWorkerManager {
    readonly #workers: Map<`${number}|${number}`, GatewayWorker>;
    readonly #messages: DiscordGatewayIPCMessageBroker;

    public constructor(messages: DiscordGatewayIPCMessageBroker) {
        this.#messages = messages;
        this.#workers = new Map<`${number}|${number}`, GatewayWorker>();
    }

    public getOrCreateWorker(workerId: number, lastShardId: number): GatewayWorker {
        const key = `${lastShardId}|${workerId}` as const;
        let worker = this.#workers.get(key);
        if (worker === undefined) {
            this.#workers.set(key, worker = new GatewayWorker(workerId, lastShardId, this.#messages));
            void worker.waitStopped().finally(() => this.#workers.delete(key));
        }
        return worker;
    }

    public * list(): Generator<GatewayWorker> {
        for (const worker of this.#workers.values())
            yield worker;
    }
}
