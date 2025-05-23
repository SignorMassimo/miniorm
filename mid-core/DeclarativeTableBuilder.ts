import { MiniOrm } from '../core'
import { DatabaseColumn, DatabaseColumnType } from '../types'

export class DeclarativeTableBuilder {
    // private dbs: any = undefined
    private dbName: string
    private tableName = ''
    private columns: DatabaseColumn[] = []
    private tables: Record<string, Record<string, DatabaseColumn[]>> = {}
    constructor(tableName: string, dbName: string) {
        this.dbName = dbName
        this.tableName = tableName
        this.initDbNamespace()
        this.initTableNamespace()
    }
    private initDbNamespace() {
        if (!this.tables[this.dbName]) this.tables[this.dbName] = {}
    }
    private initTableNamespace() {
        if (!this.tables[this.dbName][this.tableName]) this.tables[this.dbName][this.tableName] = []
        // this.dbs = MiniOrm.dbs
    }
    public column(column: DatabaseColumn) {
        this.columns.push(column)
        this.tables[this.dbName][this.tableName].push(column)
        return this
    }
    public set(tableName: string, dbName?: string) {
        // this.tables[this.dbName][this.tableName] = this.columns
        this.columns = []
        this.dbName = typeof dbName == 'string' ? dbName : this.dbName
        this.tableName = tableName
        this.initDbNamespace()
        this.initTableNamespace()
        return this
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
    public async build() {
        const dbPromises = Object.entries(this.tables).map(async ([dbName, tables]) => {
            const dbType = MiniOrm.dbs[dbName].config.type
            if (dbType.startsWith('typeorm')) return
            const db = MiniOrm.dbs[dbName].db,
                tablePromises = Object.entries(tables).map(async ([tableName, columns]) => {
                    const if_exists = await DeclarativeTableBuilder.checkTableExists(db, dbType, tableName)
                    if (if_exists) return
                    const columnDefinitions = columns.map(column => {
                        column.type = column.primaryKey ? 'INTEGER' : column.type
                        let column_length = column.length != undefined
                            ? column.length
                            : (column.type == DatabaseColumnType.VARCHAR
                                ? (column.unique ? 191 : 255)
                                : column.length)
                        if (column_length && column.unique && column_length > 191) column_length = 191
                        let columnDefinition = `${column.name} ${column.primaryKey ? 'INTEGER' : column.type}${column_length == undefined && column.type != 'VARCHAR'
                            ? ''
                            : `(${column_length})`
                            }`
                        if (column.enum) {
                            const enums = column.enum.map(e => typeof e === 'string' ? `'${e}'` : e).join(', ')
                            columnDefinition += dbType == 'sqlite'
                                ? ` CHECK( ${column.name} IN (${enums}) )`
                                : `(${enums})`
                            if (!column.notNull) columnDefinition += ' NOT NULL'
                            if (!column.defaultValue) columnDefinition += ` DEFAULT '${column.enum[0]}'`
                        }
                        if (column.primaryKey) {
                            columnDefinition += ' PRIMARY KEY'
                            if (column.type.toUpperCase() === 'INTEGER' && column.autoIncrement !== false) {
                                const autoIncrementSyntax = dbType == 'sqlite'
                                    ? 'AUTOINCREMENT'
                                    : dbType == 'mysql'
                                        ? 'AUTO_INCREMENT'
                                        : 'GENERATED ALWAYS AS IDENTITY'
                                columnDefinition += ` ${autoIncrementSyntax}`
                            }
                        }
                        if (column.notNull) columnDefinition += ' NOT NULL'
                        if (column.unique) columnDefinition += ' UNIQUE'
                        if (column.defaultValue !== undefined) {
                            if (typeof column.defaultValue === 'boolean') columnDefinition += ` DEFAULT ${column.defaultValue ? '1' : '0'}`
                            else {
                                const defaultValueStr = typeof column.defaultValue === 'string'
                                    ? `'${column.defaultValue}'`
                                    : column.defaultValue
                                columnDefinition += ` DEFAULT ${defaultValueStr}`
                            }
                        }
                        if (column.check !== undefined) columnDefinition += ` CHECK (${column.name + column.check})`
                        if (column.collate) columnDefinition += ` COLLATE ${column.collate}`
                        return columnDefinition
                    })
                    const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions.join(', ')})`
                    await MiniOrm.runQuery(dbName, query, [])
                    console.log(`${dbType.toUpperCase()} Table '${tableName}' is ready to use. Added Database '${dbName}'`)
                })
            await Promise.all(tablePromises)
        })
        await Promise.all(dbPromises)
    }
}
