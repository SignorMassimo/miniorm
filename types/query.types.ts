type Operator = ' =' | ' <' | ' >' | ' <=' | ' >=' | ' <>' | ' !='
type InOperator = ' IN '
type LikeOperator = ' LIKE ' | ' NOT LIKE '
type WithOperators<T> = {
    [K in keyof T as `${K & string}${Operator}`]?: T[K]
}
type WithInOperator<T> = {
    [K in keyof T as `${K & string}${InOperator}`]?: T[K][]
}
type WithLikeOperator<T> = {
    [K in keyof T as `${K & string}${LikeOperator}`]?: T[K] | string
}
export type WhereObject<T> = {
    [K in keyof T]?: T[K] | 'IS NULL' | 'IS NOT NULL'
} & WithOperators<T> & WithInOperator<T> & WithLikeOperator<T> & {
    _OR?: boolean
    _AND?: boolean
}

export enum DatabaseColumnType {
    // NULL tipi
    NULL = 'NULL',

    // INTEGER tipleri (SQLite ve MySQL)
    INTEGER = 'INTEGER',
    INT = 'INT',
    TINYINT = 'TINYINT',
    SMALLINT = 'SMALLINT',
    MEDIUMINT = 'MEDIUMINT',
    BIGINT = 'BIGINT',
    UNSIGNED_BIG_INT = 'UNSIGNED BIG INT',
    INT2 = 'INT2',
    INT8 = 'INT8',
    BIT = 'BIT', // MySQL

    // REAL tipleri (SQLite ve MySQL)
    REAL = 'REAL',
    DOUBLE = 'DOUBLE',
    DOUBLE_PRECISION = 'DOUBLE PRECISION',
    FLOAT = 'FLOAT',

    // TEXT/STRING tipleri (SQLite ve MySQL)
    TEXT = 'TEXT',
    CHARACTER = 'CHARACTER',
    CHAR = 'CHAR',
    VARCHAR = 'VARCHAR',
    VARYING_CHARACTER = 'VARYING CHARACTER',
    NCHAR = 'NCHAR',
    NATIVE_CHARACTER = 'NATIVE CHARACTER',
    NVARCHAR = 'NVARCHAR',
    CLOB = 'CLOB',

    // MySQL özel TEXT tipleri
    TINYTEXT = 'TINYTEXT',
    MEDIUMTEXT = 'MEDIUMTEXT',
    LONGTEXT = 'LONGTEXT',

    // NUMERIC tipleri (SQLite ve MySQL)
    NUMERIC = 'NUMERIC',
    DECIMAL = 'DECIMAL',
    BOOLEAN = 'BOOLEAN',
    BOOL = 'BOOL', // MySQL

    // DATETIME tipleri (SQLite ve MySQL)
    DATE = 'DATE',
    DATETIME = 'DATETIME',
    TIME = 'TIME',
    TIMESTAMP = 'TIMESTAMP',
    YEAR = 'YEAR', // MySQL

    // BLOB tipleri (SQLite ve MySQL)
    BLOB = 'BLOB',
    BINARY = 'BINARY',
    VARBINARY = 'VARBINARY',

    // MySQL özel BLOB tipleri
    TINYBLOB = 'TINYBLOB',
    MEDIUMBLOB = 'MEDIUMBLOB',
    LONGBLOB = 'LONGBLOB',

    // MySQL özel ENUM ve SET tipleri
    ENUM = 'ENUM',
    SET = 'SET',

    // MySQL JSON tipi (MySQL 5.7.8+)
    JSON = 'JSON',

    // MySQL Geometrik veri tipleri
    GEOMETRY = 'GEOMETRY',
    POINT = 'POINT',
    LINESTRING = 'LINESTRING',
    POLYGON = 'POLYGON',
    MULTIPOINT = 'MULTIPOINT',
    MULTILINESTRING = 'MULTILINESTRING',
    MULTIPOLYGON = 'MULTIPOLYGON',
    GEOMETRYCOLLECTION = 'GEOMETRYCOLLECTION',

    // Diğer tipler
    ANY = 'ANY'
}


export interface DatabaseColumn {
    name: string
    type: keyof typeof DatabaseColumnType
    primaryKey?: boolean
    notNull?: boolean
    unique?: boolean
    defaultValue?: string | number | boolean | null
    check?: string
    length?: number
    autoIncrement?: boolean
    collate?: string
    enum?: string[] | number[] | boolean[]
    references?: {
        table: string
        column: string
        onDelete?: 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION' | 'CASCADE'
        onUpdate?: 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION' | 'CASCADE'
    }
}

export interface SQLiteTable {
    name: string
    columns: DatabaseColumn[]
}