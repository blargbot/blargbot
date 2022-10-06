import { BotVariable } from './BotVariable';

export type GetBotVariableOptions<T extends BotVariable[`varname`]> = Omit<Extract<BotVariable, { varname: T; }>, `varname`>;
