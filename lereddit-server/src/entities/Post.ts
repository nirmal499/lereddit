//import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

/**
 * We converted this class from Entity() type to ObjectType() for GRAPHQL Query
 * We did this by stacking the decorators (decorators -> @)
 */

@ObjectType()
@Entity()
export class Post extends BaseEntity{
  // extending BaseEntity provides us with some easy to use commands like Post.find() .. etc.

  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({type:'text'})
  title!: string;

  @Field()
  @Column()
  text!: string;

  @Field()
  @Column({type:'int',default:0})
  points!: number;

  // Foreign Key will be stored in creatorId
  @Field()
  @Column()
  creatorId: number;

  /***
   * Many-to-one is a relation where A contains multiple instances of B, but B contains only one instance of A.
   * User can have multiple posts, but each post is owned by only one single user
   */
  @Field()
  @ManyToOne(() => User, user => user.posts)
  creator: User;
  
  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}

// @ObjectType()
// @Entity()
// export class Post {

//   @Field()
//   @PrimaryKey()
//   id!: number;

//   @Field()
//   @Property({type:'date'})
//   createdAt: Date = new Date();

//   @Field()
//   @Property({ type:'date',onUpdate: () => new Date() })
//   updatedAt: Date = new Date();

//   @Field()
//   @Property({type:'text'})
//   title!: string;

// }

/**
 * @Field() decorator will expose that to GRAPHQL Schema
 */

