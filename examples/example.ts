import { MiniOrm } from '../core'
import { DeclarativeTableBuilder, FluentTableBuilder, Model, QueryBuilder } from '../mid-core'
interface Users {
    id: number
    name: string
    role: 'user' | 'moderator' | 'admin'
}
export const example = <T = Users>(table: string = 'users') => {
    const dbName = 'MINI_ORM_TEST_DB'
    MiniOrm.connection(dbName, {} as any)
    return {
        ExampleQueryBuilder: new QueryBuilder<T>(dbName, table),
        ExampleModel: new Model<T>(dbName, table),
        ExampleDeclarativeTableBuilder: new DeclarativeTableBuilder(table, dbName),
        ExampleFluentTableBuilder: new FluentTableBuilder(table, dbName)
    }
}
