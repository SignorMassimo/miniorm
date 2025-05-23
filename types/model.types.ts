import type { WhereObject } from './query.types';

export type FindsType<T, K> = {
    fields?: K[],
    where?: (string | WhereObject<Partial<T> | Partial<T>>)[],
    order?: [K] | [K, 'ASC' | 'DESC']
    limit?: number
    offset?: number
    method?: 'run' | 'first'
}