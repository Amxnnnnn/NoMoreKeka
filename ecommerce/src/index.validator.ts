import express, { Express } from 'express';
import cors from 'cors';
import { PORT } from './secret.validator'
import rootRouter from './routes/index.route'
import { errorMiddleware } from './middleware/error.mid';
import { connectDatabase, prismaClient } from './prisma_connection';
import { setupSwagger } from './swagger';
import { seedSignityCompany } from './utility/seed';

const app: Express = express()

// CORS configuration - Allow frontend to access backend
app.use(cors({
    origin: [
        'http://localhost:8080',  // Vite dev server default
        'http://localhost:8081',  // Vite dev server alternative port
        'http://localhost:5173',  // Vite dev server alternative
        'http://localhost:3001',  // React dev server
        'http://localhost:3000',  // Same origin (for testing)
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json())

export { prismaClient }

// Setup Swagger API Documentation
setupSwagger(app);

app.use('/api', rootRouter)

app.use(errorMiddleware)


// After database connection verification and seeding, start the main app server!
async function startServer() {
    try {
        const isConnected = await connectDatabase();
        
        if (!isConnected) {
            console.error('Server initialization aborted due to database connection failure!') 
            process.exit(1)
        }

        // Seed default Signity company
        await seedSignityCompany();

        app.listen(PORT, () => {
            console.log("Express server is running on port :", PORT);
            console.log(`Server URL: http://localhost:${PORT}`);
            console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
            console.log(`CORS enabled for frontend origins`);
        });
    } catch (error) {
        console.error(`Failed to start server:`, error);
        process.exit(1);
    }
}

startServer();
