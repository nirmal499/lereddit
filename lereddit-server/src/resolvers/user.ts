import { User } from '../entities/User'
import { MyContext } from 'src/types'
import {Arg, Ctx, Field, InputType, Mutation, ObjectType, Query} from 'type-graphql'
import argon2 from 'argon2';
import { COOKIE_NAME } from '../constant';

@InputType()
class UsernamePasswordInput{
    @Field()
    username:string

    @Field()
    password:string
}


@ObjectType()
class FieldError{
    @Field()
    field:string;

    @Field()
    message:string;

}

/**
 * let nestedProp = obj.first?.second;
 * 
 * By using the ?. operator instead of just ., JavaScript knows to implicitly check to be sure obj.first is not null or undefined before attempting to access obj.first.second.
 * If obj.first is null or undefined, the expression automatically short-circuits, returning undefined
 */

/**
 * Question marks on TypeScript variable are used to mark that variable as an optional variable.
 * If we put the question mark when declaring a variable that variable becomes optional.
 * The optional parameters will have value as undefined or null when unused.
 * https://stackoverflow.com/questions/47942141/optional-property-class-in-typescript
 */

/**
 * FieldError[] -> represents array of errors of OjectType FieldError
 * We want user to be returned if it worked properly or I want an error to be returned
 * if there is happened to be an error
 */
@ObjectType()
class UserResponse{
    @Field(()=> [FieldError],{nullable:true})
    errors?:FieldError[]

    @Field(()=> User,{nullable:true})
    user?:User

}

/**
 * register(options: UsernamePasswordInput, ctx: MyContext): Promise<UserResponse>
 * login(options: UsernamePasswordInput, ctx: MyContext): Promise<UserResponse>
 */

export class UserResolver{

    // Returns the current user and if not logged in then return null
    @Query(() => User,{nullable:true})
    async me(@Ctx() ctx:MyContext){

        // DO THIS TO GET MORE INFO ABOUT SESSION
        // console.log(req.session)

        // user is not logged in
        if(!ctx.req.session.userId){
            return null
        }

        // user is logged in, hence we search the user from database using it's id and return the user
        const user = await ctx.em.findOne(User,{id:ctx.req.session.userId})
        return user;

        // So, we are considering that if the user has a cookie that means they are logged in.
    }




    @Mutation(()=> UserResponse)
    async register(
        @Arg('options',()=> UsernamePasswordInput) options:UsernamePasswordInput,
        @Ctx() ctx:MyContext
    ):Promise<UserResponse>{
        if(options.username.length <= 2){
            return{
                errors:[
                    {
                        field:"username",
                        message:"length must be greater than 2"
                    },
                ],
            };
        }

        if(options.password.length <= 3){
            return{
                errors:[
                    {
                        field:"password",
                        message:"length must be greater than 3"
                    },
                ],
            };
        }

        // Hashing the pasword using argon2
        const hashedPassword = await argon2.hash(options.password);
        const user = ctx.em.create(User,{username:options.username,password:hashedPassword});
        
        
        // Error handling for registering an already registered user
        try{
            await ctx.em.persistAndFlush(user);
        }catch(err){
            // duplicate username error . You can get more info by console.log("message: ",err.message)
            if(err.code === "23505"){ // err.detail.include("already exists")
                return{
                    errors:[
                        {
                            field:"username",
                            message:"username already exists"
                        },
                    ],
                };
            }
        }

        // store user id session
        // this will set a cookie on the user
        // keep them logged in
        ctx.req.session.userId = user.id;




        // We are returning user inside a Object because the UserResponse is Of Object Type
        return {
            user,
        }
    }

    // register(options: UsernamePasswordInput, ctx: MyContext): Promise<User>
    // @Mutation(()=> User)
    // async register(
    //     @Arg('options',()=> UsernamePasswordInput) options:UsernamePasswordInput,
    //     @Ctx() ctx:MyContext
    // ){

    //     // Hashing the pasword using argon2
    //     const hashedPassword = await argon2.hash(options.password);
    //     const user = ctx.em.create(User,{username:options.username,password:hashedPassword});
    //     await ctx.em.persistAndFlush(user);
        
    //     return user
    // }

    @Mutation(()=> UserResponse)
    async login(
        @Arg('options',()=> UsernamePasswordInput) options:UsernamePasswordInput,
        @Ctx() ctx:MyContext
    ):Promise<UserResponse> {
        const user = await ctx.em.findOne(User,{username:options.username})
        if(!user){
            return{
                errors:[{
                    field:"username",
                    message:"that username does not exist"

                }]
            };
        }
        
        const valid = await argon2.verify(user.password,options.password);
        if(!valid){
            return{
                errors:[{
                    field:"password",
                    message:"incorrect password"
                }]
            };
        }

        // When successfully logged in, we make a userId property in session and set it to user.id
        // With this step, cookie is also created and saved in the browser
        ctx.req.session.userId = user.id;
        // ctx.req.session.randomProperty = "Ben is cool";


        
        return {
            user,
        };
    }
    @Mutation(() => Boolean)
    logout(
        @Ctx() ctx:MyContext
    ){
        // wait for the promise or we can say wait for the destroy to happen with the callback
        return new Promise( resolve => ctx.req.session.destroy( err => { // This is our callback

            // Clearing the cookie stored in the user browser
            ctx.res.clearCookie(COOKIE_NAME);

            if(err){
                console.log(err);
                resolve(false);
                return;
            }

            resolve(true)
        })); 
    }
}


//<----------------------------registerOLD----------------------------->
// register(options: UsernamePasswordInput, ctx: MyContext): Promise<User>

// mutation{
//   register(options:{
//     username:"ben",password:"ben123"
//   }){
//     id
//     createdAt
//     updatedAt
//     username
//   }
// }

// WE GET

// {
//     "data": {
//       "register": {
//         "id": 1,
//         "createdAt": "2021-02-20T05:42:20.526Z",
//         "updatedAt": "2021-02-20T05:42:20.526Z",
//         "username": "ben"
//       }
//     }
//   }

//<----------------------------registerNEW----------------------------->
// register(options: UsernamePasswordInput, ctx: MyContext): Promise<UserResponse>

// mutation {
//     register(options: { username: "nirmal", password: "nirmal123" }) {
//       errors {
//         field
//         message
//       }
//       user {
//         id
//         createdAt
//         updatedAt
//         username
//       }
//     }
//   }

// WE GET

// {
//     "data": {
//       "register": {
//         "errors": null,
//         "user": {
//           "id": 3,
//           "createdAt": "2021-02-20T06:52:15.710Z",
//           "updatedAt": "2021-02-20T06:52:15.710Z",
//           "username": "nirmal"
//         }
//       }
//     }
//   }

//<--------->

// mutation {
//     register(options: { username: "nirmal", password: "nirmal123" }) {
//       errors {
//         field
//         message
//       }
//       user {
//         id
//         createdAt
//         updatedAt
//         username
//       }
//     }
//   }

// WE GET

// {
//     "data": {
//       "register": {
//         "errors": [
//           {
//             "field": "userbame",
//             "message": "username already exists"
//           }
//         ],
//         "user": null
//       }
//     }
//   }

//<--------------------------------------------------login----->
// mutation{
//     login(options:{
//       username:"ben",password:"ben123"
//     }){
//       errors{
//         field
//         message
//       }
//       user{
//         id
//         username
//       }
//     }
//   }

// WE GET

// {
//     "data": {
//       "login": {
//         "errors": null,
//         "user": {
//           "id": 1,
//           "username": "ben"
//         }
//       }
//     }
// }
//<--------->

// mutation{
//     login(options:{
//       username:"bewn",password:"ben123"
//     }){
//       errors{
//         field
//         message
//       }
//       user{
//         id
//         username
//       }
//     }
//   }

// WE GET

// {
//     "data": {
//       "login": {
//         "errors": [
//           {
//             "field": "username",
//             "message": "that username does not exist"
//           }
//         ],
//         "user": null
//       }
//     }
//   }

//<---------->

// mutation{
//     login(options:{
//       username:"ben",password:"ben13"
//     }){
//       errors{
//         field
//         message
//       }
//       user{
//         id
//         username
//       }
//     }
//   }

// WE GET

// {
//     "data": {
//       "login": {
//         "errors": [
//           {
//             "field": "password",
//             "message": "incorrect password"
//           }
//         ],
//         "user": null
//       }
//     }
//   }