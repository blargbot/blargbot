import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeState } from '../../types';
import { bbtag, SubtagType } from '../../utils';

export class InjectSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `inject`,
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [`code`],
                    description: `Executes any arbitrary BBTag that is within \`code\` and returns the result. Useful for making dynamic code, or as a testing tool (\`{inject;{args}}\`)`,
                    exampleCode: `Random Number: {inject;{lb}randint{semi}1{semi}4{rb}}`,
                    exampleOut: `Random Number: 3`,
                    returns: `string`,
                    execute: async (context, [code]) => {
                        return await context.withStack(async () => {
                            const ast = bbtag.parse(code.value, true);
                            const result = await context.engine.eval(ast, context);
                            if (context.data.state === BBTagRuntimeState.RETURN)
                                context.data.state = BBTagRuntimeState.RUNNING;
                            return result;
                        });
                    }
                }
            ]
        });
    }
}
