import { TagType } from "../newbu";

export interface TagArgument {

}

export interface TagHandlerOptions {
    aliases?: string[];
    category?: TagType;
    args?: TagArgument[];
    desc?: string;
    exampleCode?: string | null;
    exampleIn?: string | null;
    exampleOut?: string | null;
    deprecated?: boolean;
    staff?: boolean;
}

export abstract class BaseTagHandler implements Required<TagHandlerOptions>{
    public readonly aliases: string[];
    public readonly category: TagType;
    public readonly isTag: true;
    public readonly args: TagArgument[];
    public readonly desc: string;
    public readonly exampleCode: string | null;
    public readonly exampleIn: string | null;
    public readonly exampleOut: string | null;
    public readonly deprecated: boolean;
    public readonly staff: boolean;

    protected constructor(
        public readonly name: string,
        options: TagHandlerOptions
    ) {
        this.aliases = options.aliases ?? [];
        this.category = options.category ?? TagType.SIMPLE;
        this.isTag = true;
        this.args = options.args ?? [];
        this.desc = options.desc ?? '';
        this.exampleCode = options.exampleCode ?? null;
        this.exampleIn = options.exampleIn ?? null;
        this.exampleOut = options.exampleOut ?? null;
        this.deprecated = options.deprecated ?? false
        this.staff = options.staff ?? false;
    }
}
