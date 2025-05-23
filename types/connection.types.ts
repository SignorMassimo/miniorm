interface DefaultConnectionType {
    host?: string
    user?: string
    password?: string
    database: string
    port?: number
    ping?: number
}

export type ConnectionType = | ({
    mysql: { type: 'mysql' } & DefaultConnectionType
    pg: { type: 'postgresql' } & DefaultConnectionType & { ssl?: { rejectUnauthorized: boolean } }
    sqlite: { type: 'sqlite', path: string } & { ping?: number }
})