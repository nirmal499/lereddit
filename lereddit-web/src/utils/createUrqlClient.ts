
import {dedupExchange, fetchExchange} from 'urql';
import { cacheExchange} from '@urql/exchange-graphcache';
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

export const createUrqlClient = (ssrExchange: any) => 
({
    url: 'http://localhost:4000/graphql',
  fetchOptions:{
    credentials:"include" as const,// This will actually send our cookie and we are gonna need this for getting
    // the cookie when we register or getting the cookie when we login
  },
  // Graphcache
  exchanges: [dedupExchange, cacheExchange({
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