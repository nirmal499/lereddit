// import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


/**
 * We converted this class from Entity() type to ObjectType() for GRAPHQL Query
 * We did this by stacking the decorators (decorators -> @)
 */

 @ObjectType()
 @Entity()
 export class User extends BaseEntity {
 
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
   @Column({type:'text',unique:true})
   username!: string;
 
   @Field()
   @Column({type:'text',unique:true})
   email!: string;
 
   @Column({type:'text'})
   password!: string;
 
 }

// @ObjectType()
// @Entity()
// export class User {

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
//   @Property({type:'text',unique:true})
//   username!: string;

//   @Field()
//   @Property({type:'text',unique:true})
//   email!: string;

//   @Property({type:'text'})
//   password!: string;

// }

/**
 * @Field() decorator will expose that to GRAPHQL Schema
 */

