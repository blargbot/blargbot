import { CommandType, FlagDefinition } from "../newbu";

export interface DCommandOptions {
    aliases?: string[];
    category?: CommandType;
    hidden?: boolean;
    usage?: string;
    info?: string;
    longinfo?: string | null;
    flags?: FlagDefinition[];
    onlyOn?: string | null;
}

export abstract class BaseDCommand implements Required<DCommandOptions>{
    public readonly aliases: string[];
    public readonly category: CommandType;
    public readonly isCommand: true;
    public readonly hidden: boolean;
    public readonly usage: string;
    public readonly info: string;
    public readonly longinfo: string | null;
    public readonly flags: FlagDefinition[];
    public readonly onlyOn: string | null;

    protected constructor(
        public readonly name: string,
        options: DCommandOptions
    ) {
        this.aliases = options.aliases ?? [];
        this.category = options.category ?? CommandType.GENERAL;
        this.isCommand = true;
        this.hidden = options.hidden ?? false;
        this.usage = (this.name + options.usage).trimEnd();
        this.info = options.info ?? '';
        this.longinfo = options.longinfo ?? null;
        this.flags = options.flags ?? [];
        this.onlyOn = options.onlyOn ?? null;
    }

    event(message: unknown) {

    }
}