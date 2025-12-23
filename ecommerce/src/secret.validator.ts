import dotenv from 'dotenv'
import { constants } from 'node:buffer'

dotenv.config({path:'.env'})

export const PORT = Number(process.env.PORT) || 3000;

export const JWT_SECRET = process.env.JWT_SECRET!