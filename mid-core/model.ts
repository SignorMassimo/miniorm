import type { FindsType } from '../types/model.types'
import { type WhereObject } from '../types/query.types'
import { BaseEntityClass, QueryBuilder } from './query.builder'

export class Model<T = any> {
    private dbName: string
    private tableName: string
    private entity!: BaseEntityClass<T>
    private queryBuilder: QueryBuilder<T>

    public constructor(dbName: string, table: string | (new () => T) | typeof BaseEntityClass<T>, opt?: any) {
        this.dbName = dbName
        if (typeof table == 'string') this.tableName = table
        else {
            this.tableName = (table as any).$table ?? table.name.toLowerCase()
            this.entity = table
        }
        this.queryBuilder = new QueryBuilder<T>(this.dbName, table as any, opt)
    }

    // Basic CRUD operations
    public async find<K extends keyof T>(opt: FindsType<T, K> = {}): Promise<T[]> {
        const qb = this.queryBuilder.select(opt.fields)
        if (opt.where) qb.where(...(opt.where || []))
        if (opt.order) qb.order(opt.order ? [opt.order[0]] : undefined as any, opt.order ? opt.order[1] : undefined)
        if (opt.limit) qb.limit(opt.limit as number)
        if (opt.offset) qb.offset(opt.offset as number)
        return await qb.run()
    }

    public async findAll<K extends keyof T>(fields: K[] = []): Promise<T[]> {
        return this.queryBuilder.select(fields).run()
    }

    public async findOne<K extends keyof T>(opt: FindsType<T, K> = {}): Promise<T> {
        const qb = this.queryBuilder.select(opt.fields)
        if (opt.where) qb.where(...(opt.where || []))
        if (opt.order) qb.order(opt.order ? [opt.order[0]] : undefined as any, opt.order ? opt.order[1] : undefined)
        if (opt.limit) qb.limit(opt.limit as number)
        if (opt.offset) qb.offset(opt.offset as number)
        return await qb.first()
    }

    public async first<K extends keyof T>(opt: FindsType<T, K> = {}): Promise<T> {
        return await this.findOne(opt)
    }

    public async create(data: Partial<T>): Promise<boolean> {
        return await this.queryBuilder.insert(data)
    }

    public async update(data: Partial<T>, ...whereConditions: (string | WhereObject<Partial<T>>)[]): Promise<any> {
        return await this.queryBuilder.update(data).where(...whereConditions).run()
    }

    public async delete(...whereConditions: (string | WhereObject<Partial<T>>)[]): Promise<any> {
        return await this.queryBuilder.delete().where(...whereConditions).run()
    }

    // Aggregation methods
    public async count<K extends keyof T>(field?: K): Promise<number> {
        return await this.queryBuilder.count(field)
    }

    public async max<K extends keyof T>(field: any): Promise<number> {
        return await this.queryBuilder.max(field)
    }

    public async min<K extends keyof T>(field: K): Promise<number> {
        return await this.queryBuilder.min(field)
    }

    public async avg<K extends keyof T>(field: K): Promise<number> {
        return await this.queryBuilder.avg(field)
    }

    public async sum<K extends keyof T>(field: K): Promise<number> {
        return await this.queryBuilder.sum(field)
    }

    // Utility methods
    public async exists(...whereConditions: (string | WhereObject<Partial<T>>)[]): Promise<boolean> {
        return await this.queryBuilder.select().where(...whereConditions).exists()
    }

    public async pluck<K extends keyof T>(field: K): Promise<Array<T[K]>> {
        return await this.queryBuilder.pluck(field)
    }

    // Raw query execution
    public async raw(query: string, values: (string | number | boolean | null)[] = []): Promise<any> {
        return await this.queryBuilder.raw(query, values)
    }

    // Query builder access for more complex queries
    public query(): QueryBuilder<T> {
        return new QueryBuilder<T>(this.dbName, this.entity as any ?? this.tableName)
    }

    // Connection management
    public async disconnect(): Promise<void> {
        await this.queryBuilder.disconnect()
    }

    public async reconnect(): Promise<this> {
        await this.queryBuilder.reconnect()
        return this
    }

    // Debug helper
    public debug(type: 'now' | 'final' = 'now', func?: (sql: string, data: any) => void): this {
        this.queryBuilder.debug(type, func)
        return this
    }
}
