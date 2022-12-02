import { BotVariable } from './BotVariable.js';

export type GetBotVariableOptions<T extends BotVariable['varname']> = Omit<Extract<BotVariable, { varname: T; }>, 'varname'>;
