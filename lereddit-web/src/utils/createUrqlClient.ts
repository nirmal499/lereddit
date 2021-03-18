
import {dedupExchange, fetchExchange, stringifyVariables} from 'urql';
import { cacheExchange, Resolver} from '@urql/exchange-graphcache';
import { LoginMutation, LogoutMutation, MeDocument, MeQuery, RegisterMutation} from '../generated/graphql';

import { betterUpdateQuery } from "./betterUpdateQuery";

import { pipe, tap } from 'wonka';
import { Exchange } from 'urql';
import  Router  from 'next/router';

// An exchange for all errors :-  https://github.com/FormidableLabs/urql/issues/225
// Global Error handling (WHEN AN ERROR IS THROWN ANYWHERE IT IS HANDLED HERE)
export const errorExchange: Exchange = ({ forward }) => ops$ => {
  return pipe(
    forward(ops$),
    tap(({ error }) => {
      if (error) {
        if(error?.message.includes('Not Authenticated')){
          Router.replace("/login");
        }
      }
    })
  );
};


export const cursorPagination = (): Resolver => {
  

  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;

    // Output : entityKey outputs Query, fieldName outputs posts
    //console.log(entityKey,fieldName);// Output: Query posts

    // inspectFields(entityKey) will get all the fields in the stored cache under this Query (entityKey outputs Query)
    const allFields = cache.inspectFields(entityKey);

    //console.log("allFields: ",allFields);

    const fieldInfos = allFields.filter(info => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    //console.log("fieldArgs: ",fieldArgs);
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    //console.log("Key we created: ",)

    const isItInTheCache = cache.resolve(cache.resolve(entityKey,fieldKey) as string,"posts");

    //console.log("isItInTheCache: ",isItInTheCache);
    info.partial = !isItInTheCache;
    //console.log("Partial: ",info.partial);

    let hasMore = true;
    let results:string[] = [];
    fieldInfos.forEach(fi => {
      // https://formidable.com/open-source/urql/docs/api/graphcache/
      // resolveFieldByKey is deprecated 
      const key = cache.resolve(entityKey,fi.fieldKey) as string;
      //console.log("key: ",key);
      const data = cache.resolve(key,'posts') as string[];
      //console.log("posts: ",data);
      const _hasMore = cache.resolve(key,'hasMore');
      //console.log("_hasMore: ",_hasMore);

      if(_hasMore){
        hasMore = _hasMore as boolean;
      }

      //console.log("data",hasMore,data);
      results.push(...data);
    });

    const obj = {
      __typename:"PaginatedPosts",
      hasMore: hasMore,
      posts: results
    };
    
    //console.log("Thing returned: ",obj);

    return obj;
    

    // const visited = new Set();
    // let result: NullArray<string> = [];
    // let prevOffset: number | null = null;

    // for (let i = 0; i < size; i++) {
    //   const { fieldKey, arguments: args } = fieldInfos[i];
    //   if (args === null || !compareArgs(fieldArgs, args)) {
    //     continue;
    //   }

    //   const links = cache.resolve(entityKey, fieldKey) as string[];
    //   const currentOffset = args[offsetArgument];

    //   if (
    //     links === null ||
    //     links.length === 0 ||
    //     typeof currentOffset !== 'number'
    //   ) {
    //     continue;
    //   }

    //   const tempResult: NullArray<string> = [];

    //   for (let j = 0; j < links.length; j++) {
    //     const link = links[j];
    //     if (visited.has(link)) continue;
    //     tempResult.push(link);
    //     visited.add(link);
    //   }

    //   if (
    //     (!prevOffset || currentOffset > prevOffset) ===
    //     (mergeMode === 'after')
    //   ) {
    //     result = [...result, ...tempResult];
    //   } else {
    //     result = [...tempResult, ...result];
    //   }

    //   prevOffset = currentOffset;
    // }

    // const hasCurrentPage = cache.resolve(entityKey, fieldName, fieldArgs);
    // if (hasCurrentPage) {
    //   return result;
    // } else if (!(info as any).store.schema) {
    //   return undefined;
    // } else {
    //   info.partial = true;
    //   return result;
    // }
  };
};




export const createUrqlClient = (ssrExchange: any) => 
({
    url: 'http://localhost:4000/graphql',
  fetchOptions:{
    credentials:"include" as const,// This will actually send our cookie and we are gonna need this for getting
    // the cookie when we register or getting the cookie when we login
  },
  // Graphcache
  exchanges: [dedupExchange, cacheExchange({

    keys:{
      PaginatedPosts: () => null
    },
    // This will run whenever the Query is run and then we can alter how the query results look
    resolvers:{
      Query:{
        // posts.graphql
        posts: cursorPagination(),
      }
    },

    // Graphcache -> Cache Updates
    updates: {
      /* This is going to run whenever our register and login mutation runs and it just gonna update the cache
        And us updating the cache here is specifically we are updating the 'me' query
      */
      Mutation: {

        // After clicking logout button we need to update the cache
        logout: (_result, args, cache, info) => {
          // we want to just return null from me query after clicking logout button
          // Here we are updating the MeQuery
          betterUpdateQuery<LogoutMutation,MeQuery>( 
            cache,
            {query:MeDocument},
            _result,
            (/*result,query*/) => {
              return{
                me: null
              }
            }
          );
        },



        // login: (result:LoginMutation, args, cache, info) => {
          // cache.updateQuery({ query: MeDocument},(data:MeQuery) =>{});
        login: (_result, args, cache, info) => {
          betterUpdateQuery<LoginMutation,MeQuery>(cache,{ query: MeDocument},_result,(result,query)=>{
             // If the result of our login query is an error then we return the current query otherwise we are going to update our me query
            if (result.login.errors) {
              return query
            }else{
              return {
                me: result.login.user,
              }
            }
          })
        },
        register: (_result, args, cache, info) => {
          betterUpdateQuery<RegisterMutation,MeQuery>(cache,{ query: MeDocument},_result,(result,query)=>{
             // If the result of our register query is an error then we return the current query otherwise we are going to update our me query
            if (result.register.errors) {
              return query
            }else{
              return {
                me: result.register.user,
              }
            }
          })
        },
      }, 
    },
  }), errorExchange,ssrExchange ,fetchExchange],
});