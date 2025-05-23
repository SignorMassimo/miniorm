import { blue, red, white, yellow } from 'chalk'
import { MiniOrm } from '../core'
import { type WhereObject } from '../types/query.types'
import { DeclarativeTableBuilder } from './DeclarativeTableBuilder'

export abstract class BaseEntityClass<T = any> {
    static $table: string = this.name
}
export class QueryBuilder<T = any> {
    private sql: string = ''
    private extra: string = ''
    private dbName: string
    private dbType: string
    private tableName: string
    private entity!: BaseEntityClass<T>
    private data: any[] = []
    private is_typeorm: boolean = false
    private where_values: any = []
    private isDebug: boolean = false
    private debugFunc: any = undefined
    public constructor(dbName: string, table: string | (new () => T) | typeof BaseEntityClass<T>, opt?: any) {
        this.dbName = dbName
        if (typeof table == 'string') this.tableName = table
        else {
            this.tableName = (table as any).$table ?? table.name.toLowerCase()
            this.entity = table
        }
        this.dbType = MiniOrm.dbs[dbName].config.type
        this.is_typeorm = this.dbType.startsWith('typeorm_')
        // this.dbs = MiniOrm.dbs[dbName].db
        // if (this.is_typeorm) this.dbs = this.dbs.createQueryRunner().manager
        // else this.Model = MiniOrm
        if (opt && opt.clone == true) {
            if (opt.sql) this.sql = opt.sql
            if (opt.data) this.data = opt.data
            if (opt.entity) this.entity = opt.entity
            if (opt.extra) this.extra = opt.extra
        }
    }
    //! SELECT *|'id','name' FROM users
    public select<K extends keyof T>(fields: K[] = []) {
        const fields_ = fields.length > 0 ? fields.join(',') : '*'
        if (this.sql == '') {
            this.sql = `SELECT * FROM ${this.tableName}`
            if (fields.length > 0) this.fields(fields)
        }
        else if (this.sql.startsWith('SELECT')) this.sql = this.sql.replace(/SELECT .* FROM/, `SELECT ${fields_} FROM`)
        else if (/^ WHERE /.test(this.sql)) this.sql = `SELECT ${fields_} FROM ${this.tableName}`.trim() + this.sql
        else throw new Error(`SQL Syntax Error: ${red(this.sql)}`)
        return this
    }
    private fields(fields: any[]) {
        if (this.isIgnoreField(fields)) {
            if (fields.length > 0 && this.sql.startsWith('SELECT *')) this.sql = this.sql.replace('SELECT *', `SELECT ${fields.join(',')}`)
            else throw new Error(`SQL Syntax Error: ${red(this.sql)}`)
        }
    }
    public order<K extends keyof T>(orderby: K[], type?: 'ASC' | 'DESC') {
        if (this.isIgnoreField(orderby)) {
            this.extra = this.extra.trimRight()
            if (/SELECT .* FROM/.test(this.sql)) {
                if (orderby && orderby.length > 0) {
                    if (!this.extra.startsWith('ORDER BY')) this.extra = `ORDER BY ${orderby.join(',')} ${type ?? ''} ${this.extra}  `
                    else if (this.extra.includes('ORDER BY')) this.extra = this.extra.replace(/\s*ORDER BY\s+[^ ]+(\s+(ASC|DESC))?/i, `ORDER BY ${orderby.join(',')} ${type ?? ''}`)
                }
            } else if (this.sql == '') {
                this.select()
                this.order(orderby, type)
            } else throw new Error(`SQL Syntax Error: ${red(this.sql)}`)
        }
        return this
    }
    public limit(limit: number) {
        if (this.isIgnoreField([limit])) {
            let offset: string = ''
            this.extra = this.extra.trimRight()
            if (this.sql.startsWith('SELECT')) {
                if (this.extra.includes('OFFSET ') && !this.extra.includes('LIMIT ')) {
                    offset = this.extra.split('OFFSET')[1]
                    this.extra = this.extra.replace(/\s*OFFSET \d+\s*/, `LIMIT ${limit} OFFSET ${offset.trim()}`)
                } else if (this.extra.includes('OFFSET ') && this.extra.includes('LIMIT ')) {
                    offset = this.extra.split('OFFSET')[1]
                    this.extra = this.extra.replace(/\s*LIMIT \d+\s*/g, '').trim()
                    this.extra = this.extra.replace(/\s*OFFSET \d+\s*/, ` LIMIT ${limit} OFFSET ${offset.trim()}`)
                } else if (!this.extra.includes('LIMIT ')) this.extra += ` LIMIT ${limit}`
                else if (this.extra.includes('LIMIT ')) this.extra = this.extra.replace(/LIMIT \d+\s*/, `LIMIT ${limit}`)
            } else if (this.sql == '') {
                this.select()
                this.limit(limit)
            } else throw new Error(`SQL Syntax Error: ${red(this.sql)}`)
        }
        return this
    }
    public offset(offset: number) {
        if (this.isIgnoreField([offset])) {
            this.extra = this.extra.trimRight()
            if (this.sql.startsWith('SELECT')/*  && this.extra.includes('LIMIT') */) {
                if (!this.extra.includes('OFFSET ')) this.extra += ` OFFSET ${offset}`
                else if (this.extra.includes('OFFSET ')) this.extra = this.extra.replace(/\s*OFFSET \d+\s*/, ` OFFSET ${offset}`)
            } else throw new Error(`SQL Syntax Error: ${red(this.sql)}`)
        }
        return this
    }
    public async first(): Promise<T> {
        if (this.sql.startsWith('SELECT')) {
            this.limit(1)
            return (await this.run())[0]
        } else if (this.sql == '') {
            this.select()
            this.limit(1)
            return (await this.run())[0]
        } else throw new Error(`SQL Syntax Error: ${red(this.sql)}`)
    }
    public async end(): Promise<T> {
        if (this.sql.startsWith('SELECT')) return (await this.run()).slice(-1)[0]
        else throw new Error(`SQL Syntax Error: ${red(this.sql)}`)
    }
    private async selectMethods<K extends keyof T>(method: 'count' | 'min' | 'max' | 'avg' | 'sum', fields?: K): Promise<number> {
        if (this.isIgnoreField(Array.isArray(fields) ? fields : [fields])) {
            let [sql] = this.toSQL()
            const newFields = fields ? fields as any : '*'
            if (sql == '') {
                this.select(fields ? Array.isArray(fields) ? fields : [fields] : undefined)
                let [sql] = this.toSQL()
                this.sql = sql.replace('SELECT', `SELECT ${method.toUpperCase()}(`).replace('FROM', ') FROM')
            } else if (/(WHERE|ORDER|LIMIT|DELETE)/.test(sql)) sql = `SELECT ${method.toUpperCase()}(${newFields}) FROM (${sql.replace(/;/g, '').replace(/SELECT .* FROM/, `SELECT ${newFields} FROM`)})${this.dbType == 'postgresql' ? '' : ` as ${method.toLowerCase()}`}`
            else if (sql.startsWith('SELECT')) sql = sql.replace(/SELECT .* FROM/, `SELECT ${method.toUpperCase()}(${fields != undefined ? fields as any : '*'}) FROM`)
            else throw new Error(`SQL Syntax Error: ${red(sql)}`)
            sql != '' ? this.sql = sql : undefined
            const res = await this.run()
            return Object.values((res ?? {})[0])[0] as number
        }
        return NaN
    }
    public async count<K extends keyof T>(fields?: K): Promise<number> {
        return +(await this.selectMethods('count', fields))
    }
    public async max<K extends keyof T>(field: K): Promise<number> {
        return +(await this.selectMethods('max', field))
    }
    public async min<K extends keyof T>(field: K): Promise<number> {
        return +(await this.selectMethods('min', field))
    }
    public async avg<K extends keyof T>(field: K): Promise<number> {
        return +(await this.selectMethods('avg', field))
    }
    public async sum<K extends keyof T>(field: K): Promise<number> {
        return +(await this.selectMethods('sum', field))
    }
    //! UPDATE users SET id=1 OR name='ahmet'
    public update(set_values: Partial<T> | Partial<T>) {
        if (this.sql.length == 0) this.sql = `UPDATE ${this.tableName}`
        else throw new Error(`SQL Syntax Error: ${red(this.sql)}`)
        this.set(set_values)
        return this
    }
    private set(set_values: any) {
        if (this.sql.startsWith(`UPDATE ${this.tableName}`)) {
            this.sql += ' SET ' + Object.keys(set_values).map((k) => `${k} = ?`).join(',')
            Object.values(set_values).forEach(v => this.isIgnoreField([v]) ? this.data.push(v) : undefined)
        }
        else throw new Error(`SQL Syntax Error: ${red(this.sql)}`)
    }
    public delete() {
        if (this.sql === '') this.sql = `DELETE FROM ${this.tableName}`
        else throw new Error(`SQL Syntax Error: ${red(this.sql)}`)
        return this
    }
    public where(...where_values: (string | WhereObject<Partial<T> | Partial<T>>)[]) {
        where_values = where_values.flatMap(w => Array.isArray(w) ? w : [w])
        if (this.sql == '') this.select()
        if (Object.keys(where_values).length === 0) {
            this.where_values = []
            if (this.sql.includes(' WHERE ')) this.sql = this.sql.replace(/WHERE .* END_WHERE /, `END_WHERE`)
        } else if (where_values.some(w => typeof w == 'object' && Object.keys(where_values).length > 0)) {
            this.where_values = []
            const sql: string = where_values?.map((w, i) => {
                if (typeof w === 'object' && Object.keys(w).length > 0) {
                    const where_operator = w['_OR'] ? 'OR' : 'AND'
                    delete w[`_${where_operator}`]
                    return Object.entries(w).map(([k, v]) => {
                        let isNullOperator: string | undefined = undefined
                        if (String(v).endsWith('NULL') && String(v).startsWith('IS')) isNullOperator = v as unknown as string
                        if (this.isIgnoreField(Array.isArray(v) ? v : [v])) {
                            const regex = /(<=|>=|!=|<>|=|<|>| IS NOT | IS | LIKE | NOT LIKE | IN )/,
                                operator = k.match(/(<=|>=|!=|<>|=|<|>| IS NOT | IS | LIKE | NOT LIKE | IN )/i)?.[0] as string
                            isNullOperator != undefined ? undefined : Array.isArray(v) ? v.forEach(k => this.where_values.push(k)) : this.where_values.push(String(v).trim())
                            if (this.isIgnoreField([k.split(operator)[0].trim()])) return `${operator == ' LIKE ' && this.dbType == 'postgresql' ? `CAST(${k.replace(regex, '').trim()} AS TEXT)` : k.replace(regex, '').trim()} ${!isNullOperator ? operator == ' IN ' ? `IN( ${'?, '.repeat(Array.isArray(v) ? v.length : 0).slice(0, -2)} )` : operator ? operator.trim() + ' ?' : '= ?' : isNullOperator}`
                            else throw new Error((yellow`'${red(k)}' there is a risk in it`))
                        } else { }
                    }).join(` ${where_operator} `) + `${typeof where_values[i + 1] === 'string' || where_values[i + 1] == undefined ? '' : ' OR'}`
                } else if (typeof w == 'string') {
                    if (w.toLowerCase() == 'and' || w.toLowerCase() == 'or') return w.toUpperCase()
                    else return 'OR'
                }
            }).join(' ') + ' END_WHERE '
            if (sql.length > 1) {
                if (this.sql.includes(' WHERE ')) this.sql = this.sql.replace(/WHERE .* END_WHERE /, `WHERE ${sql}`)
                else this.sql += ` WHERE ${sql}`
            }
        } /* else throw new Error(`SQL Syntax Error: ${red(this.sql)}`) */
        return this
    }
    //! INSERT INTO table_name (column names) VALUES(values)
    public async insert(into_values: Partial<T>): Promise<boolean> {
        if (Object.keys(into_values).length === 0) this.sql = `INSERT INTO ${this.tableName} DEFAULT VALUES`
        else {
            this.sql = `INSERT INTO ${this.tableName}`
            this.values(into_values)
        }
        try {
            await this.run()
            return true
        } catch (err) {
            return false
        }
    }
    private values(into_values: any) {
        if (this.sql.startsWith(`INSERT INTO ${this.tableName}`)) {
            this.sql += `( ${Object.keys(into_values).map((k) => this.isIgnoreField([k]) ? `${k}` : undefined).join(',')} ) VALUES( ${('?,'.repeat(Object.keys(into_values).length)).slice(0, -1)} )`
            Object.values(into_values).forEach(v => this.isIgnoreField([v]) ? this.data.push(v) : undefined)
        } else throw new Error('SQL Syntax Error')
    }
    public isIgnoreValue(value: any) {
        const s = String(value)
        const blacklist = [
            /--/,
            /;\s*$/,
            /\/\*/,
            /\*\//,
            /['"]/,
            /\b0x[0-9A-F]+\b/i,
            /\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|EXEC|ALTER|CREATE)\b/i,
            /\/\*.*\*\//,
            /[`´]/,
            /\\x[0-9A-F]{2}/i,
            /\\u[0-9A-F]{4}/i,
            /[\u00A0\u2000-\u200F\u202F\u3000]/,
            /[\x00-\x08\x0B\x0C\x0E-\x1F]/,
            /(?<!\w)\d{1,2}\s*=\s*\d{1,2}(?!\w)/,
            /\b(eval|Function|constructor|window|document|globalThis)\b/i,
        ]

        for (const re of blacklist) {
            if (re.test(s)) {
                console.log(red(`SQL injection risk detected in: ${s}`))
                return false
            }
        }
        return true
    }
    public isIgnoreField(fields: any[]) {
        for (let field of fields) if (!this.isIgnoreValue(field) || !/^[a-zA-Z0-9_]+$/.test(field)) throw new Error(`'${red(field)}' SQL Injection Risk.`)
        return true
    }
    public debug(type: 'now' | 'final' = 'now', func?: (sql: string, data: any) => void) {
        if (type == 'now') {
            const [sql, data] = this.toSQL()
            if (func == undefined) {
                console.log(yellow('[DEBUG SQL]'), blue(sql))
                data.length > 0 ? console.log(yellow('[DEBUG DATA]'), `[${white(data.join(', '))}]`) : undefined
            } else func(sql, data)
        } else {
            this.isDebug = true
            if (func != undefined) this.debugFunc = func
        }
        return this
    }
    public async exists(): Promise<boolean> {
        if (this.sql.startsWith('SELECT')) {
            this.sql = this.sql.replace(/SELECT .* FROM/, 'SELECT 1 FROM')
            this.limit(1)
            const res = await this.run()
            return Array.isArray(res) && res.length > 0
        } else throw new Error('This function only uses select queries')
    }
    public clone<C = T>(opt: { db?: string, table?: string | (new () => C) | typeof BaseEntityClass<C> } = {}) {
        const tableName = typeof opt.table == 'string' ? opt.table : (opt as any).table.name ?? (opt as any).table.$table
        return new QueryBuilder<C>(opt.db ?? this.dbName, opt.table as any, { clone: true, sql: this.sql.replace(this.tableName, tableName), data: this.data, entity: this.entity, extra: this.extra })
    }
    public async raw(query: string, values: (string | number | boolean | null)[] = []) {
        query = query.replace('<table>', this.tableName)
        return await MiniOrm.runQuery(this.dbName, query, values)
    }
    public toSQL(): [string, any[]] {
        this.extra = this.extra.trimRight()
        this.extra = this.extra.includes('OFFSET') && !this.extra.includes('LIMIT') ? this.extra.replace(/OFFSET \d+/, '') : this.extra
        const data = this.data.concat(this.where_values)
        let idx: number = 0,
            sql: string = (this.sql.trim() + `${this.sql.startsWith('SELECT') ? `${this.extra.length == 0 || /(MIN|MAX|SUM|AVG|COUNT)/.test(this.sql) ? '' : this.extra.trimRight()}` : ''}`).trim()
        if (this.dbType.endsWith('postgresql')) sql = sql.replace(/\?/g, (): string => `$${++idx}`)
        sql = sql.replace(/\s+END_WHERE/g, ' ')
        return [sql, data]
    }
    public async pluck<K extends keyof T>(field: K): Promise<Array<any>> {
        if (this.sql.startsWith('SELECT')) this.sql = this.sql.replace(/SELECT .* FROM/, `SELECT ${field as string} FROM`)
        else if (this.sql == '') this.select([field])
        else if (this.sql.startsWith(' WHERE')) this.sql = `SELECT ${field as string} FROM ${this.tableName}${this.sql}`
        else throw new Error(`SQL Syntax Error: ${red(this.sql)}`)
        return (await this.run()).map((v: any) => v[field])
    }
    public async between<K extends keyof T>(field: K, start: number, end: number) {
        if (this.isIgnoreField([field])) {
            this.sql = ``
            this.select()
            this.sql += ` WHERE ${field as string} BETWEEN ? AND ?`;
            [start, end].forEach(n => this.isIgnoreField([n]) ? this.data.push(n) : undefined)
            return await this.run()
        } else throw new Error('SQL Injection Risk')
    }
    public async disconnect() {
        await MiniOrm.disconnect(this.dbName)
    }
    public async reconnect(): Promise<this> {
        await MiniOrm.reconnect(this.dbName)
        return this
    }
    public async run<R = any>(): Promise<R> {
        let res: any = undefined
        const table_exists = await DeclarativeTableBuilder.checkTableExists(MiniOrm.dbs[this.dbName].db, this.dbType as any, this.tableName)
        if (table_exists) {
            const [sql, data] = this.toSQL()
            this.sql = sql
            this.data = data
            if (this.isDebug) {
                if (this.debugFunc != undefined) this.debugFunc(sql, data)
                else {
                    console.log(yellow('[FINAL DEBUG SQL]'), blue(this.sql))
                    data.length > 0 ? console.log(yellow('[FINAL DEBUG DATA]'), `[${white(this.data.join(', '))}]`) : undefined
                }
            }
            res = await MiniOrm.runQuery(this.dbName, this.sql, this.data)
            this.sql = ''
            this.extra = ''
            this.data = []
            this.where_values = []
        } else console.log(`${red(this.tableName)} cannot exists in the ${yellow(this.dbName)}.`)
        return res as R
    }
}
