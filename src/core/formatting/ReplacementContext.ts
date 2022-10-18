import { IFormatter } from "@blargbot/domain/messages/types";

export interface ReplacementContext {
    readonly formatter: IFormatter;
    readonly valueStack: readonly unknown[];
    withValue<T>(value: unknown, action: (value: this) => T): T;
}
