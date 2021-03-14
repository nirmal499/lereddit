//import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import {Request,Response} from 'express'
import { Session,SessionData } from "express-session";
import { Redis } from "ioredis";
//import { RedisClient } from "redis";

export type MyContext = {
    //em : EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
    req: Request & { session:Session & Partial<SessionData> & { userId?: number } };
    res: Response;
    // redisClient: RedisClient
    redisClient: Redis
}

// parameter?: type is a shorthand for parameter: type | undefined
// & joins two types together