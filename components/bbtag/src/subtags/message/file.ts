import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.file;

export class FileSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'file',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: ['file', 'filename'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [file, fileName]) => this.attachFile(ctx, fileName.value, file.value)
                }
            ]
        });
    }

    public attachFile(context: BBTagContext, fileName: string, fileContent: string): void {
        const data = fileContent.startsWith('buffer:')
            ? Buffer.from(fileContent.substring(7), 'base64')
            : fileContent;
        context.data.file = { file: data, name: fileName };
    }
}
