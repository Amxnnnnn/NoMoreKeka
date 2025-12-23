import { Router } from 'express';
import authRoutes from './auth.route'
import testEmailRoutes from './test_email.route';
import userRoutes from './user.route';
import dashboardRoutes from './dashboard.route';
import departmentRoutes from './department.route';
import invitationRoutes from './invitation.route';

const rootRouter: Router = Router()

rootRouter.use('/auth', authRoutes)
rootRouter.use('/test', testEmailRoutes)
rootRouter.use('/users', userRoutes)
rootRouter.use('/dashboard', dashboardRoutes)
rootRouter.use('/departments', departmentRoutes)
rootRouter.use('/invitations', invitationRoutes)

export default rootRouter