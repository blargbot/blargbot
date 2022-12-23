import { DefaultBooleanPlugin, DefaultColorPlugin, DefaultNumberPlugin, Subtags } from '@bbtag/blargbot';
import BBTagRunner from '@bbtag/engine';
import { CompiledSubtagCallEvaluator } from '@bbtag/subtag';

const processor = new BBTagRunner({
    evaluator: new CompiledSubtagCallEvaluator([
        ...Object.values(Subtags).flatMap(t => [...new t()])
    ]),
    plugins: [
        DefaultNumberPlugin,
        new DefaultBooleanPlugin(),
        new DefaultColorPlugin({
        })

    ]
});
