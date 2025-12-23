import { PrismaClient } from "@prisma/client";
// import { prismaClient } from "./index.validator";

export const prismaClient = new PrismaClient({
    log:['query','error','warn']
})

// Database connection check crowwww!

export async function connectDatabase(){
    try{
        console.log("Connecting to PostgreSQL Database...")

        // Test the connection
        await prismaClient.$connect();

        console.log("PostgreSQL database connected successfully!");
        return true;
    } catch(error){
        console.error('Failed to connect to PostSQL database: ',error);
        return false;
    }
}