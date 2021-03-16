/**
 * TypeGraphQLQ has middleware
 * This middlware function checks if user is authenticated or not
 *  */

import { MyContext } from "src/types";
import { MiddlewareFn } from "type-graphql";
//MiddlewareFn : This a special type provided by type-graphql
// middleware runs before our resolvers
// A resolver is a function that's responsible for populating the data for a single field in your schema

export const isAuth: MiddlewareFn<MyContext> = ({context},next) => {
        
    if(!context.req.session.userId){
        throw new Error("Not Authenticated");
    }

    // If the user is authenticate (If its all good then we run a function call next)
    return next();


}
