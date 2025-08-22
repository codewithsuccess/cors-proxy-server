const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Allowed domains (whitelist)
const allowedOrigins = [
    'https://sphublive.com',
    'https://splendid-licorice-cbeb7e.netlify.app',
    'https://clever-kulfi-1cf3ba.netlify.app',
    'http://localhost:3001' // for local development
];

// ✅ CORS setup with whitelist
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, false); // Block non-browser requests (optional)
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true
}));

// ✅ Middleware to block requests from disallowed origins (extra security)
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'This proxy server can only be used from approved domains.',
            allowedOrigins
        });
    }
    next();
});

// Parse JSON bodies
app.use(express.json());

// Add CORS headers to all responses
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'CORS Proxy Server is running' });
});

// Create a single, reusable proxy middleware instance
const proxy = createProxyMiddleware({
    router: (req) => {
        // Extract the target URL from the path
        const proxyPath = req.originalUrl.substring(7); // Remove '/proxy/'
        const targetUrl = decodeURIComponent(proxyPath);

        try {
            const parsedUrl = new URL(targetUrl);
            return `${parsedUrl.protocol}//${parsedUrl.host}`;
        } catch (error) {
            return null; // Will be handled by pathRewrite
        }
    },
    pathRewrite: (path, req) => {
        const proxyPath = req.originalUrl.substring(7); // Remove '/proxy/'
        const targetUrl = decodeURIComponent(proxyPath);

        try {
            const parsedUrl = new URL(targetUrl);
            return parsedUrl.pathname + parsedUrl.search;
        } catch (error) {
            return path; // Keep original path if parsing fails
        }
    },
    changeOrigin: true,
    followRedirects: true,
    secure: true, // verify SSL certificates
    onProxyReq: (proxyReq, req, res) => {
        // Forward the original headers
        Object.keys(req.headers).forEach(key => {
            if (key.toLowerCase() !== 'host') {
                proxyReq.setHeader(key, req.headers[key]);
            }
        });
    },
    onProxyRes: (proxyRes, req, res) => {
        // Add CORS headers to the response
        proxyRes.headers['access-control-allow-origin'] = '*';
        proxyRes.headers['access-control-allow-methods'] = 'GET,PUT,POST,DELETE,PATCH,OPTIONS';
        proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin';
    },
    onError: (err, req, res) => {
        if (!res.headersSent) {
            const proxyPath = req.originalUrl.substring(7);
            const targetUrl = decodeURIComponent(proxyPath);

            res.status(502).json({
                error: 'Bad Gateway',
                message: 'Failed to connect to target server',
                target: targetUrl,
                details: err.message
            });
        }
    }
});

// Main proxy middleware - handles all requests that start with /proxy/
app.use('/proxy', (req, res, next) => {
    // Only handle requests that have something after /proxy/
    if (req.path === '/proxy' || !req.originalUrl.includes('/proxy/')) {
        return next();
    }
    // Extract the target URL from the path
    const proxyPath = req.originalUrl.substring(7); // Remove '/proxy/'
    const targetUrl = decodeURIComponent(proxyPath);

    // Basic URL validation
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        return res.status(400).json({
            error: 'Invalid URL format. Must start with http:// or https://',
            received: targetUrl,
            example: 'http://localhost:3001/proxy/https://api.example.com/endpoint'
        });
    }

    try {
        // Validate URL format
        new URL(targetUrl);

        // Use the single proxy instance
        return proxy(req, res, next);

    } catch (urlError) {
        return res.status(400).json({
            error: 'Invalid URL',
            message: urlError.message,
            providedUrl: targetUrl
        });
    }
});

// Default handler for non-proxy requests
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'This is a CORS proxy server. Use /proxy/[URL] to proxy requests.',
        usage: {
            pattern: 'http://localhost:3001/proxy/[TARGET_URL]',
            examples: [
                'http://localhost:3001/proxy/https://jsonplaceholder.typicode.com/posts/1',
                'http://localhost:3001/proxy/https://api.github.com/users/octocat',
                'http://localhost:3001/proxy/https://httpbin.org/get?test=123'
            ]
        },
        availableEndpoints: [
            'GET /health - Server health check'
        ]
    });
});

// Global error handler
app.use((err, req, res, next) => {
    if (!res.headersSent) {
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred'
        });
    }
});

app.listen(PORT, () => {
    console.log(`CORS Proxy Server running on port ${PORT}`);
});

module.exports = app;