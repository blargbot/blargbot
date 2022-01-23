import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class FileSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'file',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: ['file', 'filename'],
                    description: 'Sets the output attachment to the provided `file` and `filename`. If `file` starts with `buffer:`, the following text will be parsed as base64 to a raw buffer - useful for uploading images.',
                    exampleCode: '{file;Hello, world!;readme.txt}',
                    exampleOut: '(a file labeled readme.txt containing "Hello, world!")',
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
        context.state.file = { file: data, name: fileName };
    }
}
