//import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  @Column({type:'text'})
  title!: string;

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

