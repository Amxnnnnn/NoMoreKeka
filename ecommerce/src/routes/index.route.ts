import { Router } from 'express';
import authRoutes from './auth.route'
import testEmailRoutes from './test_email.route';
import userRoutes from './user.route';
import dashboardRoutes from './dashboard.route';
import departmentRoutes from './department.route';
import invitationRoutes from './invitation.route';
import profileRoutes from './profile.route';
import projectRoutes from './project.route';
import taskRoutes from './task.route';
import teamRoutes from './team.route';
import worklogRoutes from './worklog.route';
import leaveRoutes from './leave.route';
import notificationRoutes from './notification.route';
import analyticsRoutes from './analytics.route';

const rootRouter: Router = Router()

// Authentication routes
rootRouter.use('/auth', authRoutes)

// User management routes
rootRouter.use('/users', userRoutes)
rootRouter.use('/profile', profileRoutes)

// Company structure routes
rootRouter.use('/departments', departmentRoutes)
rootRouter.use('/teams', teamRoutes)

// Project and task management routes
rootRouter.use('/projects', projectRoutes)
rootRouter.use('/tasks', taskRoutes)

// Work and leave management routes
rootRouter.use('/work-logs', worklogRoutes)
rootRouter.use('/leaves', leaveRoutes)

// Communication routes
rootRouter.use('/notifications', notificationRoutes)
rootRouter.use('/invitations', invitationRoutes)

// Dashboard and analytics routes
rootRouter.use('/dashboard', dashboardRoutes)
rootRouter.use('/analytics', analyticsRoutes)

// Testing routes
rootRouter.use('/test', testEmailRoutes)

export default rootRouter