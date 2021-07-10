import { Binder, Binding, BindingResult, humanize } from '../../../globalCore';
import { CommandBinderState } from '../../../types';
import { CommandContext } from '../../CommandContext';
import { CommandBindingBase } from './CommandBindingBase';

export class SwitchBinding<TContext extends CommandContext> extends CommandBindingBase<TContext, never> {
    protected readonly caseInsensitiveOptions: Readonly<Record<Lowercase<string>, ReadonlyArray<Binding<CommandBinderState<TContext>>> | undefined>>;
    protected readonly expected: string;

    public constructor(
        protected readonly options: Readonly<Record<string, ReadonlyArray<Binding<CommandBinderState<TContext>>> | undefined>>,
        protected readonly aliases: Readonly<Record<string, readonly string[] | undefined>>
    ) {
        super();
        this.caseInsensitiveOptions = Object.keys(this.options)
            .reduce<Record<Lowercase<string>, ReadonlyArray<Binding<CommandBinderState<TContext>>> | undefined>>((r, key) => {
                if (this.options[key.toLowerCase()] === undefined)
                    r[key.toLowerCase()] = this.options[key];
                return r;
            }, {});
        this.expected = humanize.smartJoin(Object.keys(this.options).map(opt => `\`${opt}\``), ', ', ' or ');
    }

    public * debugView(): Generator<string> {
        yield 'Switch value';
        for (const option of Object.keys(this.options)) {
            yield `    case ${option}`;
            for (const binding of this.options[option] ?? []) {
                for (const line of binding.debugView()) {
                    yield `        ${line}`;
                }
            }
        }
    }

    public [Binder.binder](state: CommandBinderState<TContext>): BindingResult<CommandBinderState<TContext>> {
        const arg = state.flags._.get(state.argIndex)?.value;
        if (arg === undefined)
            return this.bindingError(state, state.command.error(`Not enough arguments! Expected ${this.expected} but got nothing`));

        const key = this.aliases[arg] ?? arg;
        const nextRequired = typeof key === 'string' ? this.options[key] : key.flatMap(k => this.options[k] ?? []);

        if (nextRequired !== undefined && nextRequired.length > 0)
            return this.bindingSuccess(state, nextRequired, 1, undefined, false);

        const nextOptional = this.options[''];
        if (nextOptional !== undefined)
            return this.bindingSuccess(state, nextOptional, 0, undefined, false);

        return this.bindingError(state, state.command.error(`Expected ${this.expected} but got \`${arg}\``));
    }
}
