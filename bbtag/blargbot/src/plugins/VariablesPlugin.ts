export abstract class VariablesPlugin {
    public abstract get(name: string): Promise<BBTagVariableValue | undefined>;
    public abstract set(name: string, value: BBTagVariableValue | undefined): Promise<void>;

    public abstract persist(names?: Iterable<string>): Promise<void>;
    public abstract rollback(names?: Iterable<string>): Promise<void>;
}

export type BBTagVariableValue = string | number | boolean | null | { [P: string]: BBTagVariableValue; } | BBTagVariableValue[];
