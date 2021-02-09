export type MasterMessageHandler<TContract, TKey extends ContractKey<TContract>>
    = (data: MasterPayload<TContract, TKey>, reply: (data: WorkerPayload<TContract, TKey>) => void, id: Snowflake) => void;
export type WorkerMessageHandler<TContract, TKey extends ContractKey<TContract>>
    = (data: WorkerPayload<TContract, TKey>, reply: (data: MasterPayload<TContract, TKey>) => void, id: Snowflake) => void;

export type ContractKey<TContract> = string & (keyof TContract | keyof WorkerContract);
export type WorkerPayloads<TContract> = {
    [P in ContractKey<TContract>]:
    P extends keyof WorkerContract ? WorkerContract[P] extends [infer R, unknown] ? R : never :
    P extends keyof TContract ? TContract[P] extends [infer R, unknown] ? R : never :
    never;
};
export type MasterPayloads<TContract> = {
    [P in ContractKey<TContract>]:
    P extends keyof WorkerContract ? WorkerContract[P] extends [unknown, infer R] ? R : never :
    P extends keyof TContract ? TContract[P] extends [unknown, infer R] ? R : never :
    never;
};
export type WorkerPayload<TContract, TKey extends ContractKey<TContract> = ContractKey<TContract>>
    = WorkerPayloads<TContract>[TKey];
export type MasterPayload<TContract, TKey extends ContractKey<TContract> = ContractKey<TContract>>
    = MasterPayloads<TContract>[TKey];

export type WorkerMessage<TContract, TKey extends ContractKey<TContract> = ContractKey<TContract>>
    = { type: TKey, id: Snowflake, data: WorkerPayload<TContract, TKey> };
export type MasterMessage<TContract, TKey extends ContractKey<TContract> = ContractKey<TContract>>
    = { type: TKey, id: Snowflake, data: MasterPayload<TContract, TKey> };

export type WorkerMessageHandlers<TContract>
    = { [P in ContractKey<TContract>]: Parameters<WorkerMessageHandler<TContract, P>> };
export type MasterMessageHandlers<TContract>
    = { [P in ContractKey<TContract>]: Parameters<MasterMessageHandler<TContract, P>> };

export interface WorkerContract {
    'alive': [null, never];
    'ready': ['Hello!', never];
    'log': [{ text: string, level: string, timestamp: string }, never];
    'exit': [{ code: number | null, signal: NodeJS.Signals | null }, never];
    'close': [{ code: number | null, signal: NodeJS.Signals | null }, never];
    'disconnect': [null, never];
    'kill': [unknown, never];
    'error': [{ error: Error }, never];
}