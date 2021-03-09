import {MikroORM} from "@mikro-orm/core";

import { __prod__ } from "./constant";
import { Post } from "./entities/Post";
import path from 'path';
import dotenv from 'dotenv';
import { User } from "./entities/User";

dotenv.config({
    path:'config.env'
})


export default {
    migrations:{
        path: path.join(__dirname,'./migrations'), // path to folder with migration files
        pattern: /^[\w-]+\d+\.[tj]s$/, // how to match migration files (ts or js)
        // pattern: /^[\w-]+\d+\.ts$/, // how to match migration files (js)
    },
    entities: [Post,User],
    dbName:'lereddit',
    // user:'',
    password:process.env.DBPASS,
    type:'postgresql',
    // When we are not in production et debug true
    debug: !__prod__
} as Parameters<typeof MikroORM.init>[0];
// Parameters returns an array and we just want the first parameter


// export default {
//     entities: [Post],
//         dbName:'lereddit',
//         // user:'',
//         // password:'',
//         type:'postgresql',
//         // When we are not in production et debug true
//         debug: !__prod__
// } as const;

/**
 * const x = 'x'; // has the type 'x' 
 * let y = 'x';   // has the type string
 * let y = 'x' as const; // y has type 'x'
 */