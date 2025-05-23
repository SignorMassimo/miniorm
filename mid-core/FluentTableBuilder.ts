import { MiniOrm } from '../core';

enum STATIC {
    NOT_NULL = 'NOT NULL',
    AUTO_INCREMENT = 'AUTO_INCREMENT'
}
type ColumnType = 'varchar' | 'integer' | 'boolean' | 'enum' | 'timestamp';

interface ColumnOption {
    type: ColumnType;
    length?: number;
    notNull?: string;
    autoIncrement?: string;
    default?: string | number | boolean | null;
    primary?: string
    unique?: string
    enum?: string[] | number[];
}

export class FluentTableBuilder {
    public sql: string = ``
    public queryies: { [db: string]: string[] } = {}
    public columns: Record<string, ColumnOption> = {}
    private column = ''
    private engineType: string | null = null
    private charsetType: string | null = null
    private dbName: string = ''
    private dbType: 'mysql' | 'sqlite' | 'postgresql' = 'mysql'
    private tableName = ''
    constructor(tableName: string, dbName: string) {
        this.dbName = dbName
        this.dbType = MiniOrm.dbs[dbName].config.type
        this.tableName = tableName
        this.sql = `CREATE TABLE IF NOT EXISTS ${tableName} ( COLUMNS_PLACEHOLDER )`
    }
    public set(opt: { db?: string, table?: string } = { db: this.dbName, table: this.tableName }) {
        if (!this.queryies[this.dbName]) this.queryies[this.dbName] = []
        this.queryies[this.dbName].push(this.toSQL())
        this.sql = ''
        this.dbName = opt.db ?? this.dbName
        this.dbType = MiniOrm.dbs[opt.db ?? this.dbName].config.type
        this.tableName = opt.table ?? this.tableName
        this.sql = `CREATE TABLE IF NOT EXISTS ${this.tableName} ( COLUMNS_PLACEHOLDER )`
        this.charset('')
        this.column = ''
        this.columns = {}
        return this
    }
    public engine(engine: 'InnoDB' | 'MyISAM' | 'MEMORY' | 'CSV' | 'ARCHIVE') {
        this.engineType = engine
        return this
    }
    public charset(charset: string) {
        this.charsetType = charset
        return this
    }
    public id(nameOrLength?: string | number, length: number = 11) {
        length = typeof nameOrLength == 'number' ? nameOrLength : length
        const name = typeof nameOrLength == 'string' ? nameOrLength : 'id'
        this.integer(name, length)
        this.notNULL()
        this.auto_increment()
        this.primary()
        this.columns[name] = { ...this.columns[this.column], length }
        return this
    }
    public string(name: string, length: number) {
        this.column = name
        this.columns[name] = { ...this.columns[this.column], type: 'varchar', length }
        return this
    }
    public integer(name: string, length: number) {
        this.column = name
        this.columns[name] = { ...this.columns[this.column], type: 'integer', length }
        return this
    }
    public bool(name: string) {
        this.column = name
        this.columns[name] = { ...this.columns[this.column], type: 'boolean' }
        return this
    }
    public enum(name: string, values: any[]) {
        this.column = name
        this.columns[name] = { ...this.columns[this.column], type: 'enum', enum: values }
        return this
    }
    public timestamps() {
        this.columns['created_at'] = { type: 'timestamp', default: 'CURRENT_TIMESTAMP', notNull: STATIC.NOT_NULL }
        this.columns['updated_at'] = { type: 'timestamp', default: 'CURRENT_TIMESTAMP', notNull: STATIC.NOT_NULL }
        return this
    }
    public primary() {
        this.columns[this.column] = { ...this.columns[this.column], primary: 'PRIMARY KEY' }
        this.auto_increment()
        return this
    }
    public unique() {
        this.columns[this.column] = { ...this.columns[this.column], unique: 'UNIQUE' }
        return this
    }
    public notNULL() {
        this.columns[this.column] = { ...this.columns[this.column], notNull: STATIC.NOT_NULL }
        return this
    }
    public nullable() {
        delete this.columns[this.column].notNull
        return this
    }
    private auto_increment() {
        this.columns[this.column] = { ...this.columns[this.column], autoIncrement: STATIC.AUTO_INCREMENT }
        return this
    }
    public default(value: any) {
        this.columns[this.column] = { ...this.columns[this.column], default: value }
        return this
    }
    public toSQL(): string {
        const lines: string[] = []
        for (const [key, values] of Object.entries(this.columns)) {
            let type = values.type.toUpperCase()
            if (values.enum) {
                const enumValues = values.enum.map(val => typeof val === 'string' ? `'${val}'` : val).join(', ')
                type = `ENUM(${enumValues})`
                if (this.dbType == 'sqlite') type = `TEXT CHECK(${key} IN(${enumValues}))`
            } else if ((values.length && values.type != 'integer') || this.dbType != 'sqlite' && !(['boolean', 'timestamp'].includes(values.type))) type += `(${values.length})`
            const notNull = values.notNull ? ` ${STATIC.NOT_NULL}` : '',
                autoInc = values.autoIncrement ? this.dbType == 'sqlite'
                    ? ' AUTOINCREMENT'
                    : this.dbType == 'mysql'
                        ? 'AUTO_INCREMENT'
                        : ' GENERATED ALWAYS AS IDENTITY'
                    : '',
                primaryKey = ` ${values.primary ?? ''}`,
                uniqueKey = ` ${values.unique ?? ''}`,
                defaultVal: string = Object.prototype.hasOwnProperty.call(values, 'default')
                    ? ((): string => {
                        if (values.default === null) return ' DEFAULT NULL'
                        if (typeof values.default === 'string') {
                            return values.default.toUpperCase() === 'CURRENT_TIMESTAMP'
                                ? ' DEFAULT CURRENT_TIMESTAMP'
                                : ` DEFAULT '${values.default}'`
                        }
                        return ` DEFAULT ${values.default}`
                    })()
                    : ''
            lines.push(` ${key} ${type} ${primaryKey.trim()} ${uniqueKey.trim()} ${autoInc.trim()} ${notNull.trim()} ${defaultVal.trim()} `.trimRight())
        }
        let sql = `CREATE TABLE IF NOT EXISTS ${this.tableName} (\n${lines.join(',\n')}\n)`.trim()
        if (this.dbType == 'mysql') sql += ` ENGINE=${this.engineType ?? 'InnoDB'} ${this.charsetType ? `DEFAULT CHARSET=${this.charsetType}` : ''}`
        return sql
    }
    public async build() {
        if (this.sql == '') this.sql = `CREATE TABLE IF NOT EXISTS ${this.tableName} ( COLUMNS_PLACEHOLDER )`
        this.set()
        if (Object.keys(this.queryies).length > 0) for await (const [dbName, sqls] of Object.entries(this.queryies)) for await (const sql of sqls) await MiniOrm.runQuery(dbName, sql, [])
        else await MiniOrm.runQuery(this.dbName, this.toSQL(), [])
        this.engineType = null
        this.sql = ''
        this.column = ''
        this.columns = {}
    }
    public static checkTableExists(db: any, dbType: 'mysql' | 'postgresql' | 'sqlite', tableName: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (dbType === 'mysql') {
                db.query(
                    `SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
                    [tableName],
                    (err: any, results: any[]) => {
                        if (err) return reject(err)
                        resolve(results.length >= 1)
                    }
                )
            } else if (dbType === 'sqlite') {
                db.get(
                    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
                    [tableName],
                    (err: any, row: any) => {
                        if (err) return reject(err)
                        resolve(!!row)
                    }
                )
            } else if (dbType === 'postgresql') {
                db.query(
                    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
                    [tableName],
                    (err: any, results: any) => {
                        if (err) return reject(err)
                        resolve(results.rows.length >= 1)
                    }
                )
            } else {
                reject(new Error('Unsupported DB type'))
            }
        })
    }
}
