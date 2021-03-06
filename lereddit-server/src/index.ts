import 'reflect-metadata';
//import {MikroORM} from "@mikro-orm/core";
import { COOKIE_NAME, __prod__ } from "./constant";
//import microConfig from './mikro-orm.config';
import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import {buildSchema} from 'type-graphql'
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';

import dotenv from 'dotenv';

import cors from 'cors';
import { MyContext } from "./types";
//import { sendEmail } from "./utils/sendEmail";
//import { User } from "./entities/User";
import {createConnection} from 'typeorm'
import { User } from "./entities/User";
import { Post } from "./entities/Post";
import path from "path";

dotenv.config({
    path:'config.env'
})


/**
 * If you use the async keyword before a function definition, you can then use await within the function.
 * When you await a promise, the function is paused in a non-blocking way until the promise settles.
 * If the promise fulfills, you get the value back.
 * If the promise rejects, the rejected value is thrown.
 */
const main = async () =>{

    // Checking testEmailAccount ( user and pass )
    // sendEmail("bob@bob.com","Hello There");

    /**
     * connect to the database
     */

    const conn = await createConnection({
        type:'postgres',
        database: 'lireddit',
        username: 'postgres',
        password: process.env.DBPASS,
        logging:true,
        synchronize:true, // No need to do migration ,it will automatically create tables (do the migrations for you)
        migrations:[path.join(__dirname,"./migrations/*")],// We are using it now for dummy data
        entities:[Post,User]
    })

    // Running migrations that have not been run (We are using it now for inserting dummy data (FakePosts))
    await conn.runMigrations();

    /**
     * To delete all the Post just make synchronize to false
     * and then uncomment this line
     */
    // await Post.delete({})

    //const orm = await MikroORM.init(microConfig);

    // Deleting all our users
    // await orm.em.nativeDelete(User,{});

    /**
     * Run migrations
     */
    //await orm.getMigrator().up();

     /**
     * Run sql commands
     */
    // const post = orm.em.create(Post,{title:'my first post'});
    // await orm.em.persistAndFlush(post);


     /**
     * Find all the POST
     */
    // const posts = await orm.em.find(Post,{});
    // console.log(posts);

    const app = express();


    const RedisStore = connectRedis(session);
    const redisClient = new Redis();
    
    /* import redis from 'redis';
    const redisClient = redis.createClient();
    Instead of this we are using ioredis
    */ 

    
    // cors will be applied to all the routes e.g '/' , '/register' etc.
    app.use(cors({
        origin:"http://localhost:3000",
        credentials:true,
    }));

    /* Session middleware will run before the apollo middleware, So the order is very important
    since we will be using session middleware inside apollo middleware.
    With the help of session we can store a cookie in user's browser to let the user stay logged in
    */
    app.use(
    session({
        name:COOKIE_NAME,
        store: new RedisStore({ client: redisClient,
            // The TTL is reset every time a user interacts with the server. You can disable this behavior in 
            // some instances by using disableTouch
            disableTouch:true

            // If the session cookie has a expires date, connect-redis will use it as the TTL.
            // Otherwise, it will expire the session using the ttl option (default: 86400 seconds or one day).
        }),
        cookie:{
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
            httpOnly:true, // In our JS code in the frontend ,we will not be able to access the cookie
            sameSite:'lax',// csrf
            secure:__prod__ // cookie only works in https

        },
        saveUninitialized:false, // Creates a session by default even if we don't store any data on it, so we don't want empty session so, set it to false
        secret: 'qewekwq098khadhldadn005',
        resave: false,
    })
    )

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers:[HelloResolver,PostResolver,UserResolver],
            validate:false,
        }),
        /**
         * context is a special object that is accessable by all resolvers (i.e HelloResolver,PostResolver)
         * with the help of @Ctx decorator
         */
        context:({req,res}):MyContext => ({ req,res, redisClient })
        //context:({req,res}):MyContext => ({ em:orm.em,req,res, redisClient })

    });

    /**
     * Creates a GraphQL endpoints for us on express
     * Go to http://localhost:4000/graphql
     */
    apolloServer.applyMiddleware({
        app,

        cors:false,
        // cors:{
        //     origin:"http://localhost:3000/"
        // },
        // default is cors: { origin: "*" }
    });
    // app.get('/',(_,res)=>{
    //     res.send('Hello World');
    // })
    app.listen(4000,()=>{
        console.log('Server started on port 4000');
    });

}

main().catch(err=>{
    console.error(err);
})