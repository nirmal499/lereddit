import {Query} from 'type-graphql'

export class HelloResolver{
    @Query(()=> String)
    hello(){
        return 'Hello World'
    }
}


/**
 * http://localhost:4000/graphql
 * 
 * {
 *      hello  
 * }
 * 
 * WE GET
 * 
 * {
 *      "data":{
 *            "hello": "Hello World"
 *         }
 * }
 * 
 * BECOZ
 * 
 * hello(){
 *      retur n "Hello World"
 * }
 * 
 */