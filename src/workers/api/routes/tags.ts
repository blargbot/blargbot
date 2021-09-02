import { Api } from '@api';
import { BaseRoute } from '@api/BaseRoute';
import { ApiResponse } from '@api/types';
import { StoredTag } from '@core/types';
import { mapping } from '@core/utils';

export class TagsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/tags');

        this.addRoute('/:tagName', {
            get: req => this.getTagByName(req.params.tagName),
            put: req => this.setTagByName(req.params.tagName, req.body, this.getUserId(req)),
            delete: req => this.deleteTagByName(req.params.tagName, this.getUserId(req))
        });
    }

    public async getTagByName(tagName: string): Promise<ApiResponse> {
        const tag = await this.api.database.tags.get(tagName);
        if (tag === undefined)
            return this.notFound();

        return this.ok({
            name: tag.name,
            content: tag.content,
            author: tag.author
        });
    }

    public async setTagByName(tagName: string, body: unknown, author: string | undefined): Promise<ApiResponse> {
        if (author === undefined)
            return this.badRequest();

        const mapped = tagBodyMapping(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await this.api.database.tags.get(tagName);
        if (current !== undefined && current.author !== author)
            return this.forbidden('You are not the author of this tag');

        const tag: Mutable<StoredTag> = {
            uses: 0,
            author: author,
            name: tagName,
            content: '',
            ...current,
            lastmodified: new Date()
        };

        if ('name' in mapped.value && mapped.value.name !== tagName) {
            // Rename
            if (current === undefined)
                return this.notFound();

            if (await this.api.database.tags.get(mapped.value.name) !== undefined)
                return this.badRequest(`The tag ${mapped.value.name} already exists`);

            tag.name = mapped.value.name;
        }

        tag.content = mapped.value.content ?? tag.content;

        if (!await this.api.database.tags.set(tag))
            return this.internalServerError('Failed to update');

        if (tagName !== tag.name)
            await this.api.database.tags.delete(tagName);

        const result = {
            name: tag.name,
            content: tag.content,
            author: tag.author
        };

        return current === undefined ? this.created(result) : this.ok(result);
    }

    public async deleteTagByName(name: string, author: string | undefined): Promise<ApiResponse> {
        if (author === undefined)
            return this.badRequest();

        const tag = await this.api.database.tags.get(name);
        if (tag === undefined)
            return this.notFound();

        if (tag.author !== author)
            return this.forbidden('You are not the author of this tag');

        if (!await this.api.database.tags.delete(name))
            return this.internalServerError('Failed to delete');

        return this.noContent();
    }
}

const tagBodyMapping = mapping.mapChoice(
    mapping.mapObject({
        content: mapping.mapOptionalString,
        name: mapping.mapString
    }, { strict: true }),
    mapping.mapObject({
        content: mapping.mapString
    }, { strict: true })
);
