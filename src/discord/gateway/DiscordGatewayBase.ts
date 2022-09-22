import { promiseRaceAbortable } from '../util';
import { DiscordGatewayDisconnectError } from './DiscordGatewayDisconnectError';
import { TypedEventEmitter } from './TypedEventEmitter';

export interface DiscordGatewayEventsBase {
    disconnected: [error: DiscordGatewayDisconnectError];
}

export class DiscordGatewayBase<TEvents extends Record<keyof TEvents, readonly unknown[]> & DiscordGatewayEventsBase> extends TypedEventEmitter<TEvents> {
    readonly #signal: AbortSignal;

    protected constructor(signal: AbortSignal) {
        super({ captureRejections: true });
        this.#signal = signal;
    }

    public async waitFor<T extends keyof TEvents>(event: T, abort?: AbortSignal): Promise<TEvents[T][0]> {
        return await this.waitForAny([event], abort);
    }

    public async waitForAny<T extends Array<keyof TEvents>>(events: T, signal?: AbortSignal): Promise<TEvents[T[number]][0]>
    public async waitForAny(events: PropertyKey[], signal?: AbortSignal): Promise<unknown> {
        const resultPromise = new Promise<unknown[]>((res, rej) => {
            const end = <T>(end: (value: T) => void, value: T): void => {
                this.off('disconnected', disconnect);
                for (const event of events)
                    this.off(event, resValue);
                end(value);
            };

            const disconnect = (error: Error): void => end(rej, error);
            const resValue = (...args: unknown[]): void => end(res, args);

            for (const event of events)
                this.once(event, resValue);
            if (!events.includes('disconnect'))
                this.once('disconnected', disconnect);
        });

        const signals = [this.#signal];
        if (signal !== undefined)
            signals.push(signal);

        const result = await promiseRaceAbortable(resultPromise, ...signals);

        return result[0];
    }
}
