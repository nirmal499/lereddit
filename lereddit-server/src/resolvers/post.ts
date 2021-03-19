import { Post } from '../entities/Post'
//import { MyContext } from 'src/types'
import {Arg, Ctx, Field, FieldResolver, InputType, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware} from 'type-graphql'
import { MyContext } from 'src/types';
import { isAuth } from '../middleware/isAuth';
import { getConnection } from 'typeorm';

@InputType()
class PostInput{
    @Field()
    title: string

    @Field()
    text: string
}

@ObjectType()
class PaginatedPosts{
    @Field(()=> [Post])
    posts: Post[]

    @Field()
    hasMore: Boolean;
}

@Resolver(Post)
export class PostResolver{

    @FieldResolver(()=> String)
    textSnippet(
        @Root() root: Post
    ){
        return root.text.slice(0,50);
    }

    // All Posts
    @Query(()=> PaginatedPosts)
    async posts( /* @Ctx() ctx:MyContext */
        @Arg('limit',() => Int) limit:number,
        // When we set something to nullable we need to explicitly set the types her ()=> String
        @Arg('cursor',()=> String, {nullable:true}) cursor:string|null
    ): Promise<PaginatedPosts>{

        //return Post.find();


        /***
         * Let say the user asked for (realLimit)20 posts, so we fetch upto (realLimitPlusOne)21 posts
         * posts.slice(0,realLimit) will slice it upto 20 posts since we don't wanna give them more than they asked for
         * posts.length === realLimitPlusOne we are checking whether we have more posts or not
         */
        const realLimit = Math.min(50,limit);
        const realLimitPlusOne = realLimit + 1;


        const replacements: any[] = [realLimitPlusOne];

        if(cursor){
            //const cursorToBePassed = new Date(cursor)
            //replacements.push(cursorToBePassed.toISOString());
            replacements.push(new Date(cursor));

        }

        //RAW SQL
        const posts = await getConnection().query(`
            select p.*,
            json_build_object(
                'id', u.id,
                'username', u.username,
                'email', u.email
                ) creator
            from post p
            inner join public.user u on u.id = p."creatorId"
            ${cursor ? `where p."createdAt" < $2`:""}
            order by p."createdAt" DESC
            limit $1
        `,replacements);

        // Date fetched from posts(for creator: createdAt,updatedAt) is not able to serialized by GRAPHQL 
        // So, it is not showing on localhost:4000/graphql
        // const posts = await getConnection().query(`
        //     select p.*,
        //     json_build_object(
        //         'id', u.id,
        //         'username', u.username,
        //         'email', u.email,
        //         'createdAt', u."createdAt",
        //         'updatedAt', u."updatedAt"
        //         ) creator
        //     from post p
        //     inner join public.user u on u.id = p."creatorId"
        //     ${cursor ? `where p."createdAt" < $2`:""}
        //     order by p."createdAt" DESC
        //     limit $1
        // `,replacements);

        
        //Using Query Builder
        // const qb =  getConnection()
        // .getRepository(Post)
        // .createQueryBuilder("p")
        // .innerJoinAndSelect("p.creator","u",'u.id = p."creatorID"')
        // .orderBy('p."createdAt"',"DESC")
        // .take(realLimitPlusOne);

        // if(cursor){
        //     qb.where('p."createdAt" < :cursor', { cursor: new Date(cursor) })
        // }

        //const posts = await qb.getMany();

        //console.log("posts: ",posts[0]);
        

        return {
            posts: posts.slice(0,realLimit),
            hasMore: posts.length === realLimitPlusOne
        };


        //return ctx.em.find(Post,{});
    }

    // Single Post looking using Id which is going to be of type Int ( i.e () => Int), if not found then return null (i.e {nullable:true})
    @Query(()=> Post,{nullable:true})
    post( @Arg('idOfPost',()=> Int) id: number): Promise<Post | undefined>{
        return Post.findOne(id);
    }

    // @Query(()=> Post,{nullable:true})
    // post( @Arg('idOfPost',()=> Int) id: number,@Ctx() ctx:MyContext): Promise<Post | null>{
    //     return ctx.em.findOne(Post,{id});
    // }

    // Creating Post and returning that created Post
    // By using middleware isAuth : It will throw an error if user tries to create post without logging in
    @Mutation(()=> Post)
    @UseMiddleware(isAuth)
    createPost(
        @Arg('input',()=> PostInput) input: PostInput,
        @Ctx() ctx:MyContext
        ): Promise<Post>{

        // This is actually gonna use 2 sql queries
        return Post.create({
            ...input,
            creatorId: ctx.req.session.userId
        }).save();
    }

    // async createPost( @Arg('title',()=> String) title: string,@Ctx() ctx:MyContext): Promise<Post>{
    //     const post = ctx.em.create(Post,{title});
    //     await ctx.em.persistAndFlush(post);
    //     return post
    // }

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
    async updatePost( @Arg('id') id: number,@Arg('title',()=> String,{nullable:true}) title: string): Promise<Post|null>{
        const post = await Post.findOne(id); // we donot do findOne({id}); because id is our PrimaryGeneratedColumn
        
        if(!post){ // if post not found
            return null;
        }
        if(typeof title !== 'undefined'){
            await Post.update( {id} , {title} ); // Based on id we are updating title
        }
        return post;
    }


    // async updatePost( @Arg('id') id: number,@Arg('title',()=> String,{nullable:true}) title: string,@Ctx() ctx:MyContext): Promise<Post|null>{
    //     const post = await ctx.em.findOne(Post,{id});
    //     // if post not found
    //     if(!post){
    //         return null;
    //     }
    //     if(typeof title !== 'undefined'){
    //         post.title = title;
    //         await ctx.em.persistAndFlush(post);
    //     }
    //     return post;
    // }

    /**
     * Delete post using lookup field id and return boolean whether 
     * the delete operation was successful or not
     */
    @Mutation(()=> Boolean)
    
    async deletePost( @Arg('id') id: number): Promise<boolean>{
        const result = await Post.delete(id);
        // console.log("Result->",result); // it shows Result-> DeleteResult { raw: [], affected: 0 }
        if(result.affected !== 0){
            return true; // post id was present and was deleted
        }else{
            return false; // if that post id is not present
        }
    }
    
    // async deletePost( @Arg('id') id: number,@Ctx() {em}:MyContext): Promise<boolean>{
    //     // The conversion rule for Boolean:
    //     // Values that are intuitively “empty”, like 0, an empty string, null, undefined, and NaN, become false.
    //     // Other values become true.
    //     // Please note: the string with zero "0" is true

    //     const result = await em.nativeDelete(Post,{id});
    //     if(Boolean(result)){
    //         return true
    //     }else{
    //         return false
    //     }
    // }
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

