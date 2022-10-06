import { BotVariable, GetBotVariableOptions } from '../models';

export interface BotVariableStore {
    set<K extends BotVariable[`varname`]>(name: K, value: GetBotVariableOptions<K> | undefined): Promise<boolean>;
    get<K extends BotVariable[`varname`]>(key: K): Promise<GetBotVariableOptions<K> | undefined>;
    get(key: string): Promise<unknown>;
    delete(key: string): Promise<boolean>;
}
