const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import routes
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const userRoutes = require('./routes/users');
const deviceRoutes = require('./routes/devices');
const alertRoutes = require('./routes/alerts');
const subscriptionRoutes = require('./routes/subscriptions');
const paymentRoutes = require('./routes/payments');
const systemRoutes = require('./routes/systems');
const logRoutes = require('./routes/logs');
const reportRoutes = require('./routes/reports');
const contractRoutes = require('./routes/contracts');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const webhookRoutes = require('./routes/webhooks');
const adminRoutes = require('./routes/admin');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { auditLogger } = require('./middleware/audit');

// Import services
const { initializeSocket } = require('./sockets');
const { startScheduledJobs } = require('./jobs');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SentriX API',
      version: '1.0.0',
      description: 'Security Platform API',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'SentriX API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', auditLogger('company'), companyRoutes);
app.use('/api/users', auditLogger('user'), userRoutes);
app.use('/api/devices', auditLogger('device'), deviceRoutes);
app.use('/api/alerts', auditLogger('alert'), alertRoutes);
app.use('/api/subscriptions', auditLogger('subscription'), subscriptionRoutes);
app.use('/api/payments', auditLogger('payment'), paymentRoutes);
app.use('/api/systems', auditLogger('system'), systemRoutes);
app.use('/api/logs', auditLogger('log'), logRoutes);
app.use('/api/reports', auditLogger('report'), reportRoutes);
app.use('/api/contracts', auditLogger('contract'), contractRoutes);
app.use('/api/notifications', auditLogger('notification'), notificationRoutes);
app.use('/api/analytics', auditLogger('analytics'), analyticsRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', auditLogger('admin'), adminRoutes);

// 404 handler
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
