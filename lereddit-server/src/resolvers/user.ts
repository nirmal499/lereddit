import { User } from '../entities/User'
import { MyContext } from 'src/types'
import {Arg, Ctx, Field, InputType, Mutation, ObjectType, Query} from 'type-graphql'
import argon2 from 'argon2';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constant';
import { sendEmail } from '../utils/sendEmail';
import { v4 } from "uuid";
//import { RedisClient } from 'redis';

@InputType()
class UsernamePasswordInput{
    @Field()
    username:string

    @Field()
    email: string;

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

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('token') token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() ctx:MyContext
    ): Promise<UserResponse> {
        if(newPassword.length <= 3){
            return{
                errors:[
                    {
                        field:"newPassword",
                        message:"length must be greater than 3"
                    },
                ],
            };
        }

        const key = FORGET_PASSWORD_PREFIX + token;

        const userId = await ctx.redisClient.get(key);
        if(!userId){
            return{
                errors:[
                    {
                        field:"token",
                        message:"token expired"
                    },
                ],
            };
        }



        // Since redisClient (ioredis) stores all its values in string so, we need to convert it into int
        const userIdNum = parseInt(userId);
        const user = await User.findOne(userIdNum);
        //const user = await ctx.em.findOne(User,{id: parseInt(userId)});

        // For some reason the user was deleted in the middle of there Forgot Password
        if(!user){
            return{
                errors:[{
                    field:"token",
                    message:"user no longer exists"

                }]
            };
        }


        // save it to database
        await User.update(
            {
                id: userIdNum
            },
            {
                password: await argon2.hash(newPassword)
            }
        );// we are updating password using id

        //user.password = await argon2.hash(newPassword);
        //await ctx.em.persistAndFlush(user);


        /**
         * Here we are deleting the token stored in redis so, that
         * they cannot changePassword twice after with that same token stored
         */
        await ctx.redisClient.del(key)


        // store user id session
        // this will set a cookie on the user
        // log in user after change password
        ctx.req.session.userId = user.id;

        return {
            user
        }

    }


    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() ctx:MyContext 
    ){
        const user = await User.findOne({ where: {email} } ); // Since email is not an PrimaryGeneratedColumn that's we used where
        //const user = await ctx.em.findOne(User,{ email });

        if(!user){
            // the email is not in database
            return true; // For security
            /**
             * Some you don't want to tell the user that the email doesn't exist
             * The reason being just for security that way they won't phish through
             * entire user trying to forgot password on every single one or something like that
             */
        }

        // token helps us to validate who they are during resetting their password
        const token = v4(); // It will give us a random string

        await ctx.redisClient.set(FORGET_PASSWORD_PREFIX + token,user.id,'ex',1000 * 60 * 60 * 24 * 3) //  we are giving them time upto 3 days 

        await sendEmail(email,`<a href="http://localhost:3000/change-password/${token}">Reset Password</a>`);

        return true
    }

    // Returns the current user and if not logged in then return null
    @Query(() => User,{nullable:true})
    /* async */ me(@Ctx() ctx:MyContext){

        // DO THIS TO GET MORE INFO ABOUT SESSION
        // console.log(req.session)

        // user is not logged in
        if(!ctx.req.session.userId){
            return null
        }

        // user is logged in, hence we search the user from database using it's id and return the user
        /* const user = await User.findOne(ctx.req.session.userId);
           return user;
        OR
        In this we don't need to make the function async anymore, since we are returing Promise
        */
       return User.findOne(ctx.req.session.userId);
        
        /* const user = await ctx.em.findOne(User,{id:ctx.req.session.userId})
        return user;
        OR
        return ctx.em.findOne(User,{ id:ctx.req.session.userId}) // In this we don't need to make the function async anymore, since we are returing Promise
        */

        // So, we are considering that if the user has a cookie that means they are logged in.
    }




    @Mutation(()=> UserResponse)
    async register(
        @Arg('options',()=> UsernamePasswordInput) options:UsernamePasswordInput,
        @Ctx() ctx:MyContext
    ):Promise<UserResponse>{

        if(!options.email.includes("@")){
            return{
                errors:[
                    {
                        field:"email",
                        message:"invalid email"
                    },
                ],
            };
        }

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
        const user  = User.create({username: options.username, email: options.email , password:hashedPassword});
        // const user = ctx.em.create(User,{username: options.username, email: options.email , password:hashedPassword});

        // Error handling for registering an already registered user
        try{
            await user.save();
            //await ctx.em.persistAndFlush(user);
        }catch(err){
            // duplicate username error . You can get more info by console.log("message: ",err)
            // console.log("message: ",err)
            if(err.code === "23505"){ // err.detail.includes("already exists")

                if(err.detail.includes("email")){
                    return{
                        errors:[
                            {
                                field:"email",
                                message:"email already exists"
                            },
                        ],
                    };
                }

                if(err.detail.includes("username")){
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
        }

        /*
            Insert using QueryBuilder(TypeORM)

            const hashedPassword = await argon2.hash(options.password);
            let user;
            try{ 
                const result = await getConnection()
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values({
                        username: options.username, 
                        email: options.email , 
                        password:hashedPassword
                    }).returning("*").execute();
                console.log("result",result);
                user = result.raw[0]; // For info check console.log("result",result);
            }catch(err){
                ...(CONTINUED)
            }


        */

        // store user id session
        // this will set a cookie on the user
        // log in user after register
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

        // Important for frontend so that nextjs could show appropriate errors
        const userSearchedForUsername = await User.findOne({username:options.username})
        // console.log(userSearchedForUsername); show undefined when userSearchedForUsername not found
        if(!userSearchedForUsername){
            return{
                errors:[{
                    field:"username",
                    message:"that username does not exist "
                }]
            };
        }

        // Important for frontend so that nextjs could show appropriate errors 
        const userSearchedForEmail = await User.findOne({email:options.email})
        if(!userSearchedForEmail){
            return{
                errors:[{
                    field:"email",
                    message:"that email does not exist "

                }]
            };
        }
        

        // // Important for frontend so that nextjs could show appropriate errors
        // const userSearchedForUsername = await ctx.em.findOne(User,{username:options.username});
        // if(!userSearchedForUsername){
        //     return{
        //         errors:[{
        //             field:"username",
        //             message:"that username does not exist "

        //         }]
        //     };
        // }

        // // Important for frontend so that nextjs could show appropriate errors 
        // const userSearchedForEmail = await ctx.em.findOne(User,{email:options.email});
        // if(!userSearchedForEmail){
        //     return{
        //         errors:[{
        //             field:"email",
        //             message:"that email does not exist "

        //         }]
        //     };
        // }
        
        const valid = await argon2.verify(userSearchedForEmail.password,options.password);
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
        ctx.req.session.userId = userSearchedForEmail.id;
        // ctx.req.session.randomProperty = "Ben is cool";


        
        return {
            user: userSearchedForEmail,
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