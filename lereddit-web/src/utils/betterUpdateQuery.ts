import { Cache,QueryInput } from "@urql/exchange-graphcache";

// This is just like a helper function that make it easy to cast the types
export function betterUpdateQuery<Result,Query>(
    cache: Cache,
    queryInput: QueryInput,
    result: any,
    fn: (r: Result,q: Query) => Query
  ){
    return cache.updateQuery(queryInput,(data) => fn(result,data as any) as any)
  }