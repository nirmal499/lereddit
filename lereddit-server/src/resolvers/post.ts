import { Post } from '../entities/Post'
import { MyContext } from 'src/types'
import {Arg, Ctx, Int, Mutation, Query} from 'type-graphql'

export class PostResolver{
    // All Posts
    @Query(()=> [Post])
    posts( @Ctx() ctx:MyContext): Promise<Post[]>{
        return ctx.em.find(Post,{});
    }

    // Single Post looking using Id which is going to be of type Int ( i.e () => Int), if not found then return null (i.e {nullable:true})
    @Query(()=> Post,{nullable:true})
    post( @Arg('idOfPost',()=> Int) id: number,@Ctx() ctx:MyContext): Promise<Post | null>{
        return ctx.em.findOne(Post,{id});
    }

    // Creating Post and returning that created Post 
    @Mutation(()=> Post)
    async createPost( @Arg('title',()=> String) title: string,@Ctx() ctx:MyContext): Promise<Post>{
        const post = ctx.em.create(Post,{title});
        await ctx.em.persistAndFlush(post);
        return post
    }

    /**
     * Updating Post using lookup field id , to be updated title which can be null and returning that updated Post and if post
     * if post not found then return null and if found then update the title (which can be null also)
     */
    /**
     * Here id can be inferred by GRAPHQL we don't need to explicitly mention its type by writing () => Int.
     * We could done the same thing for above function (createPost,post,posts).
     * Whenever we need to mention any property of arguments passed to GRAPHQL i.e {nullable:true}
     * we need to mention the passed arguments types like done below i.e ()=> String for the argument 'title'
     */
    @Mutation(()=> Post,{nullable:true})
    async updatePost( @Arg('id') id: number,@Arg('title',()=> String,{nullable:true}) title: string,@Ctx() ctx:MyContext): Promise<Post|null>{
        const post = await ctx.em.findOne(Post,{id});
        // if post not found
        if(!post){
            return null;
        }
        if(typeof title !== 'undefined'){
            post.title = title;
            await ctx.em.persistAndFlush(post);
        }
        return post;
    }

    /**
     * Delete post using lookup field id and return boolean whether 
     * the delete operation was successful or not
     */
    @Mutation(()=> Boolean)
    async deletePost( @Arg('id') id: number,@Ctx() {em}:MyContext): Promise<boolean>{
        // The conversion rule for Boolean:
        // Values that are intuitively “empty”, like 0, an empty string, null, undefined, and NaN, become false.
        // Other values become true.
        // Please note: the string with zero "0" is true

        const result = await em.nativeDelete(Post,{id});
        if(Boolean(result)){
            return true
        }else{
            return false
        }
    }
}

/**
 * 
 * We want this GRAPHQL QUERY to return array of POSTS
 * @Query are for getting data from DB
 * @Mutation are for creating,updating,inserting data in DB
 */


// {
//   posts{
//     id
//     createdAt
//     updatedAt
//     title
//   }
// }

// WE GET 

// {
//   "data": {
//     "posts": [
//       {
//         "id": 1,
//         "createdAt": "2021-02-19T10:53:50.000Z",
//         "updatedAt": "2021-02-19T10:53:50.000Z",
//         "title": "my first post"
//       },
//       {
//         "id": 3,
//         "createdAt": "2021-02-19T10:56:53.000Z",
//         "updatedAt": "2021-02-19T10:56:53.000Z",
//         "title": "my first post"
//       }
//     ]
//   }
// }

//  < ---------------------------For Mutation-------->

// mutation{
//     createPost(title:"post from graphql"){
//       id
//       title
//       createdAt
//     }
//   }

// {
//     "data": {
//       "createPost": {
//         "id": 5,
//         "title": "post from graphql",
//         "createdAt": "2021-02-19T12:31:08.186Z"
//       }
//     }
//   }
