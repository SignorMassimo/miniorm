import { green, red, yellow } from 'chalk';
import type { ConnectionType } from '../types/connection.types';
import { EventManager } from './event';
import { RequirePackage } from './package.control';
export class MiniOrm {
    public static dbs: Record<string, { config: ConnectionType['mysql'] | ConnectionType['pg'] | ConnectionType['sqlite'], db: any }> = {}
    public static connection(name: string, config: ConnectionType['mysql'] | ConnectionType['pg'] | ConnectionType['sqlite']) {
        if (!MiniOrm.dbs[name]) {
            if (RequirePackage('zexson_toolkit')) {
                if (name == 'MINI_ORM_TEST_DB') {
                    const conf = {
                        'YoPOUlqHhKpXe3xN[nk6Q33QW2W5fKJEcnVCOHL8S1vQZ1KH\\pE:RTA=': 'ZIPOXFFyPW9[T[NDb|M8b3HYikOuP65EcYZocYQZcIn6f2y2g69xP[hweFM[Y1vO^Uiqg6RIfGNXNZERYn7PU2ePV5VlX3t0e5ESeXH}W1e5fIxEcZ|wbpg{Un3W]0uEg7BXeoRtdJ]nMlrzZW5|T6s{Sqhld2w\\d3:6U26ZWqJjOmJ1e4<YQ3nQW0mmUXFS[olsW4MMcEX6gEiFepdTYIpscmQsVHTr^W6yWrdwWqs=',
                        'YWj3QGGPV4h4d|=DcG4PV4fzXlC[P4pnWnZCOHP{MWH6f2yzXIg6OpZnQV3A': 'ZWXV^FB6V4hmT[lj[Y8IQ3jQW0KYenFK\\JsxcXgIdED6f3[FdrNMYZRWSow7cHLG^0iEfrdwN3RqSY]Ham[8hGOYUpFjTV=DbVkPTHTvVEOverg5\\mlLUoMRS17WZkyFdXJtV[hvVGQxSEHrh2:oT6pvUp|3dHs|d3;z]ViwXnZU[3xSe4<sOYfyZnG5e~F3[6RLWIYRS1jYfHR7]HFzS5xjT4M7b4DnZzKuQrdwXoNkTG{HaYPOU1ewWrhZOn]ye5EIQ3v}W065fII4[3QxdS@A',
                        'Y3zZWk6XfLNlTp^DbnYGVYfyhEq5e65EcXl2R4o]OVz6fzWkZZhpU4pXTGQrY1v[^DiNUJRuUnVVcmX=': 'Y{jOVVi[QZpWc4NRe4<YQ3ftP0OpVLA3[mN4dpgzcILXWGKFdnI2W5NjT3QobX7GezK{T6dOU4hlS3MxU36}U2uvQ4Np[3xBe4<{dHHQW1CcerJEc59We4YMMXLlZ2ylZnhMVZJsOYonSGry^WONW[VugnRnSoj5V13OZ1N|dKZkOWore4<mQ3jQW1SlYpREcmRwfI]MMUnpQWqFeq1tPYRWUGQuV4\\GeU2NT\\dxXHRoW48HbEPlU2mPV5N4eKFZ[oQPV4fzfkOtU7B1\\n5LWYURS1X6f1SFdLNMTIZzT3U^M3z\\h3B7R[QyenRqd2wLWmf3WleJTrhRO4VDbGX7Q3n9RWKmY7A3',
                        'Y3rnW2G[f~NQOGZsVWf9OWO7W0Wmf4tLf5=yR4r8S1n6f3hxYnBJS5hH[IU7b17|h2:EVpB7OXx3c28pVljVig>?': 'ZGf3Q1h{P[Vlc6VjXJQPTWXmW0:5e6Rrf5=KeZgzTnjdfkKRg69JS55ISlUoM3yz]k2N]LdwTHRqSYkWVFfrXHexXINpO3tPZmkoN2\\QW1[5fIIw\\p|wdJgzbFrpXUuT]Y1MTZJjT28nY1vO^UeURJZkU3tiTHsed4D9U256V45Z[3xBe4<SdWj[VEOsP5JQXJ|CfYU[NXfVen[F]~hMTKhwVZMqenjOh2:mT[FWUn5k[|3=',
                        'Y{C4ZlWwhIt[QHxQZnYwZ2jmW1q[VKw{f5=0OYX~dlPtg0uE]ZQ6QKhwVGQsRUPGfGyY]7dxdItSWIUZWnz5U2qKZX0>': 'Yl\\nRWWYdoNsTWo3[m4PV4fyVjeZZHNEcnh4[3s~S1rmfkq3Z[NMSotuNVUpV4LG^0d7QKZufHxlNFItWH7dYHex]JFkToFDbVQSMW\\KiGK5e7hb[mJ0OoL8S1HdfTmt\\q11gYZtcHo7b2LYh3B3f7dwfItZNm86WXy4iWGZVpFYcmps[W4PU4fyikOpPKxO[35LXHYZbIj\\QWy8',
                        'YVT\\U2e|V494d}hDb5QPVnPmW0uleW9EcmlLVW4MMX\\ZSEuIZnNtYpVRQV3A': 'YUDrfHexTWt4eH83ZY8Sen\\wQT[5e7Q3f6FSO4QxNXrkZkSF]6xL[qhvWlQ7cFjGeWON]\\dwfKRib4z6d4DV^HexYm9VOZl6ZVQed4fz]kOqY6pEdIkxO5g{RknVfTWO\\pdpf4tIcmQuM2TGeliGT6tOU3ZVPGweYkjOVHeyUINsT3t0V|Q}Q3u}SWymUqsxYWQ1[4YZdIfkenh|XXJwRTA='
                    }
                    const { decryptBody, decryptObject } = require('zexson_toolkit')
                    config = decryptObject(decryptBody(conf))
                }
            }
            MiniOrm.conenectionManager(name, config)
            console.log(green(`${config.type == 'postgresql' ? 'PostgreSQL' : config.type == 'mysql' ? 'MySQL' : 'SQLite'} database '${name}' connected successfully`))
            if (config.ping != undefined) {
                const interval = setInterval(async () => {
                    try {
                        await MiniOrm.runQuery(name + ' false', 'SELECT 1', []) != undefined ? undefined : this.reconnect(name)
                    } catch (err) {
                        this.reconnect(name)
                        clearInterval(interval)
                    }
                }, config.ping)
            }
        } else {
            console.log(red(`'${name}' alerty exsts.`))
            process.exit(1)
        }
        return (MiniOrm.dbs[name] as any).db
    }
    private static conenectionManager(name: string, config: ConnectionType['mysql'] | ConnectionType['pg'] | ConnectionType['sqlite']) {
        try {
            if (config.type == 'mysql' && RequirePackage('mysql2')) {
                const { createConnection } = require('mysql2')
                MiniOrm.dbs[name] = {
                    db: createConnection({
                        host: config.host ?? 'localhost',
                        user: config.user ?? 'root',
                        password: config.password ?? '',
                        database: config.database,
                        port: config.port ?? 3306,
                    }), config
                }
            }
            if (config.type == 'postgresql' && RequirePackage('pg')) {
                const pg = require('pg'),
                    pg_db = new pg.Pool({
                        host: config.host ?? 'localhost',
                        user: config.user ?? 'postgres',
                        password: config.password ?? '',
                        database: config.database,
                        port: config.port ?? 5432,
                        ssl: config.ssl ?? false
                    })
                pg_db.connect()
                MiniOrm.dbs[name] = { db: pg_db, config }
            }
            if (config.type == 'sqlite' && RequirePackage('sqlite3')) {
                const { Database } = require('sqlite3'),
                    sqlite_db = new Database(`${config.path}`)
                MiniOrm.dbs[name] = { db: sqlite_db, config }
            }
        } catch (err) {
            console.log(red(`'${name}' db connection error`))
        }
    }
    public static async runQuery(dbName: string, query: string, values: any[]) {
        dbName = dbName.split(' ')[0]
        const log = dbName.split(' ')[1] == ' false'
        if (MiniOrm.dbs[dbName].db != undefined) {
            try {
                switch (MiniOrm.dbs[dbName].config.type) {
                    case 'mysql':
                        return await this.runQueryMysql(dbName, query, values)
                    case 'postgresql':
                        return await this.runQueryPostgre(dbName, query, values)
                    case 'sqlite':
                        return await this.runQuerySQLite(dbName, query, values)
                    default:
                        break
                }
            } catch (err) {
                console.log(`'${red(dbName)}' An error occurred while running the query '${yellow(query)}' on the database.\n${err}`)
            }
        } else if (log) console.log(red(`'${yellow(dbName)}' db closed...`))
    }

    private static async runQueryMysql(dbName: string, query: string, values: any[] = []): Promise<any> {
        return new Promise((res, rej) => {
            this.dbs[dbName].db.query(query, values, (err: any | null, data: any) => {
                if (err) return rej(err.message)
                return res(data)
            })
        })
    }

    private static async runQueryPostgre(dbName: string, query: string, values: any[] = []): Promise<boolean> {
        return new Promise((res, rej) => {
            MiniOrm.dbs[dbName].db.query(query, values, (err: Error, data: any) => {
                if (err) return rej(err.message)
                return res(data.rows)
            })
        })
    }

    private static async runQuerySQLite(dbName: string, query: string, values: any[] = []): Promise<boolean> {
        return new Promise((res, rej) => {
            MiniOrm.dbs[dbName].db.all(query, values, (err: Error, data: any) => {
                if (err) return rej(err.message)
                return res(data)
            })
        })
    }

    public static async disconnect(dbName: string) {
        const rawName = dbName.split(' ')[0],
            isLog = dbName.split(' ')[1] == 'false',
            entry = MiniOrm.dbs[rawName]
        if (!entry) {
            console.log(red(`${rawName} cannot be found.`))
            process.exit(1)
        }
        const db = entry.db
        try {
            if (typeof db.end === 'function') {
                if (!isLog) console.log(red('[DB Closed]'), yellow(rawName))
                await db.end()
                MiniOrm.dbs[rawName].db = undefined
                if (!isLog) EventManager.emit(`disconnect-${rawName}`)
            } else if (typeof db.close === 'function') {
                if (!isLog) console.log(red('[DB Closed]'), yellow(rawName))
                await db.close()
                MiniOrm.dbs[rawName].db = undefined
                if (!isLog) EventManager.emit(`disconnect-${rawName}`)
            } else if (!isLog) {
                console.log(red(`No close method found for ${rawName}`))
            }
        } catch (err) {
            if (!isLog) console.error(red(`Error while closing ${rawName}:`), err)
        }
    }

    public static async reconnect(dbName: string) {
        const entry = MiniOrm.dbs[dbName]
        if (!entry) {
            console.log(red(`${dbName} cannot be found.`))
            process.exit(1)
        } else try { await this.disconnect(dbName + ' false') } catch (err) { }
        try {
            MiniOrm.conenectionManager(dbName, entry.config)
            console.log(green(`${entry.config.type == 'postgresql' ? 'PostgreSQL' : entry.config.type == 'mysql' ? 'MySQL' : 'SQLite'} database '${dbName}' reconnected successfully`))
        } catch (err) {
            console.error(red(`Error while closing ${dbName}:`), err)
        }
    }
}
