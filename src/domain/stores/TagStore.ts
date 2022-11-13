import { StoredTag } from '../models';

export interface TagStore {
    list(skip: number, take: number): Promise<readonly string[]>;
    count(): Promise<number>;
    byAuthor(userId: string): Promise<readonly string[]>;
    byAuthor(userId: string, skip: number, take: number): Promise<readonly string[]>;
    byAuthorCount(userId: string): Promise<number>;
    search(partialName: string, skip: number, take: number): Promise<readonly string[]>;
    searchCount(partialName: string): Promise<number>;
    delete(name: string): Promise<boolean>;
    deleteByAuthor(author: string): Promise<boolean>;
    disable(tagName: string, userId: string, reason: string): Promise<boolean>;
    top(count: number): Promise<readonly StoredTag[]>;
    get(tagName: string): Promise<StoredTag | undefined>;
    getAllByAuthor(authorId: string): Promise<readonly StoredTag[]>;
    set(tag: StoredTag): Promise<boolean>;
    update(tagName: string, tag: Partial<StoredTag>): Promise<boolean>;
    setProp<K extends keyof StoredTag>(tagName: string, key: K, value: StoredTag[K]): Promise<boolean>;
    add(tag: StoredTag): Promise<boolean>;
    incrementUses(tagName: string, count?: number): Promise<boolean>;
    incrementReports(tagName: string, count?: number): Promise<boolean>;
    getFavourites(userId: string): Promise<readonly string[]>;
    setFavourite(tagName: string, userId: string, favourite: boolean): Promise<boolean>;
}
