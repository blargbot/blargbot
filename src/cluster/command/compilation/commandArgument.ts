import { CommandArgument, CommandVariableTypeMap } from '@blargbot/cluster/types';

export function createCommandArgument<K extends keyof CommandVariableTypeMap>(key: K, value: CommandVariableTypeMap[K] | undefined | ReadonlyArray<CommandVariableTypeMap[K]>): CommandArgument {
    const name = `${key[0].toUpperCase()}${key.slice(1)}` as UppercaseFirst<K>;

    let fullKey: keyof CommandArgument;
    if (value === undefined)
        fullKey = `asOptional${name}`;
    else if (Array.isArray(value))
        fullKey = `as${name}s`;
    else
        fullKey = `as${name}`;

    return populateMissingArgumentAccessors({ [fullKey]: value });
}

export function populateMissingArgumentAccessors(commandArgument: Partial<CommandArgument>): CommandArgument {
    Object.setPrototypeOf(commandArgument, fullArgument);
    return commandArgument as CommandArgument;
}

function throwNotDeclared<T extends keyof CommandVariableTypeMap>(key: T, getValue?: () => CommandVariableTypeMap[T]): CommandVariableTypeMap[T] {
    if (getValue !== undefined) {
        try {
            return getValue();
        } catch { /*NOOP*/ }
    }
    const err = new Error(`Value was not declared as a ${key}`);
    Error.captureStackTrace(err, throwNotDeclared);
    throw err;
}

const fullArgument: CommandArgument = {
    get asBigint() { return throwNotDeclared(`bigint`); },
    get asBoolean() { return throwNotDeclared(`boolean`); },
    get asChannel() { return throwNotDeclared(`channel`); },
    get asDuration() { return throwNotDeclared(`duration`); },
    get asInteger() { return throwNotDeclared(`integer`); },
    get asLiteral() { return throwNotDeclared(`literal`); },
    get asMember() { return throwNotDeclared(`member`); },
    get asNumber() { return throwNotDeclared(`number`, () => this.asInteger); },
    get asRole() { return throwNotDeclared(`role`); },
    get asSender() { return throwNotDeclared(`sender`, () => this.asUser); },
    get asString() { return throwNotDeclared(`string`, () => this.asLiteral); },
    get asUser() { return throwNotDeclared(`user`, () => this.asMember.user); },

    get asBigints() { return [this.asBigint]; },
    get asBooleans() { return [this.asBoolean]; },
    get asChannels() { return [this.asChannel]; },
    get asDurations() { return [this.asDuration]; },
    get asIntegers() { return [this.asInteger]; },
    get asLiterals() { return [this.asLiteral]; },
    get asMembers() { return [this.asMember]; },
    get asNumbers() { return [this.asNumber]; },
    get asRoles() { return [this.asRole]; },
    get asSenders() { return [this.asSender]; },
    get asStrings() { return [this.asString]; },
    get asUsers() { return [this.asUser]; },

    get asOptionalBigint() { return this.asBigint; },
    get asOptionalBoolean() { return this.asBoolean; },
    get asOptionalChannel() { return this.asChannel; },
    get asOptionalDuration() { return this.asDuration; },
    get asOptionalInteger() { return this.asInteger; },
    get asOptionalLiteral() { return this.asLiteral; },
    get asOptionalMember() { return this.asMember; },
    get asOptionalNumber() { return this.asNumber; },
    get asOptionalRole() { return this.asRole; },
    get asOptionalSender() { return this.asSender; },
    get asOptionalString() { return this.asString; },
    get asOptionalUser() { return this.asUser; }
};
