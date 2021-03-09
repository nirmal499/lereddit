import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

/**
 * We converted this class from Entity() type to ObjectType() for GRAPHQL Query
 * We did this by stacking the decorators (decorators -> @)
 */
@ObjectType()
@Entity()
export class Post {

  @Field()
  @PrimaryKey()
  id!: number;

  @Field()
  @Property({type:'date'})
  createdAt: Date = new Date();

  @Field()
  @Property({ type:'date',onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Field()
  @Property({type:'text'})
  title!: string;

}

/**
 * @Field() decorator will expose that to GRAPHQL Schema
 */

