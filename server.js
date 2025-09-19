// const express = require('express');
// const { createProxyMiddleware } = require('http-proxy-middleware');
// const cors = require('cors');
// const { URL } = require('url');

// const app = express();
// const PORT = process.env.PORT || 3001;

// // ✅ Allowed domains (whitelist)
// const allowedOrigins = [
//     'https://sphublive.com',
//     'https://splendid-licorice-cbeb7e.netlify.app',
//     'https://clever-kulfi-1cf3ba.netlify.app',
//     'http://127.0.0.1:5500',
//     'http://localhost:3001' // for local development
// ];

// // ✅ CORS setup with whitelist
// app.use(cors({
//     origin: function (origin, callback) {
//         if (!origin) return callback(null, false); // Block non-browser requests (optional)
//         if (allowedOrigins.includes(origin)) {
//             return callback(null, true);
//         } else {
//             return callback(new Error('Not allowed by CORS'));
//         }
//     },
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
//     credentials: true
// }));

// // ✅ Middleware to block requests from disallowed origins (extra security)
// app.use((req, res, next) => {
//     const origin = req.headers.origin;
//     if (origin && !allowedOrigins.includes(origin)) {
//         return res.status(403).json({
//             error: 'Forbidden',
//             message: 'This proxy server can only be used from approved domains.',
//             allowedOrigins
//         });
//     }
//     next();
// });

// // Parse JSON bodies
// app.use(express.json());

// // Add CORS headers to all responses
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');

//     // Handle preflight requests
//     if (req.method === 'OPTIONS') {
//         return res.sendStatus(200);
//     }

//     next();
// });

// // Health check endpoint
// app.get('/health', (req, res) => {
//     res.json({ status: 'OK', message: 'CORS Proxy Server is running' });
// });

// // Create a single, reusable proxy middleware instance
// const proxy = createProxyMiddleware({
//     router: (req) => {
//         // Extract the target URL from the path
//         const proxyPath = req.originalUrl.substring(7); // Remove '/proxy/'
//         const targetUrl = decodeURIComponent(proxyPath);

//         try {
//             const parsedUrl = new URL(targetUrl);
//             return `${parsedUrl.protocol}//${parsedUrl.host}`;
//         } catch (error) {
//             return null; // Will be handled by pathRewrite
//         }
//     },
//     pathRewrite: (path, req) => {
//         const proxyPath = req.originalUrl.substring(7); // Remove '/proxy/'
//         const targetUrl = decodeURIComponent(proxyPath);

//         try {
//             const parsedUrl = new URL(targetUrl);
//             return parsedUrl.pathname + parsedUrl.search;
//         } catch (error) {
//             return path; // Keep original path if parsing fails
//         }
//     },
//     changeOrigin: true,
//     followRedirects: true,
//     secure: true, // verify SSL certificates
//     onProxyReq: (proxyReq, req, res) => {
//         // Forward the original headers
//         Object.keys(req.headers).forEach(key => {
//             if (key.toLowerCase() !== 'host') {
//                 proxyReq.setHeader(key, req.headers[key]);
//             }
//         });
//     },
//     onProxyRes: (proxyRes, req, res) => {
//         // Add CORS headers to the response
//         proxyRes.headers['access-control-allow-origin'] = '*';
//         proxyRes.headers['access-control-allow-methods'] = 'GET,PUT,POST,DELETE,PATCH,OPTIONS';
//         proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin';
//     },
//     onError: (err, req, res) => {
//         if (!res.headersSent) {
//             const proxyPath = req.originalUrl.substring(7);
//             const targetUrl = decodeURIComponent(proxyPath);

//             res.status(502).json({
//                 error: 'Bad Gateway',
//                 message: 'Failed to connect to target server',
//                 target: targetUrl,
//                 details: err.message
//             });
//         }
//     }
// });

// // Main proxy middleware - handles all requests that start with /proxy/
// app.use('/proxy', (req, res, next) => {
//     // Only handle requests that have something after /proxy/
//     if (req.path === '/proxy' || !req.originalUrl.includes('/proxy/')) {
//         return next();
//     }
//     // Extract the target URL from the path
//     const proxyPath = req.originalUrl.substring(7); // Remove '/proxy/'
//     const targetUrl = decodeURIComponent(proxyPath);

//     // Basic URL validation
//     if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
//         return res.status(400).json({
//             error: 'Invalid URL format. Must start with http:// or https://',
//             received: targetUrl,
//             example: 'http://localhost:3001/proxy/https://api.example.com/endpoint'
//         });
//     }

//     try {
//         // Validate URL format
//         new URL(targetUrl);

//         // Use the single proxy instance
//         return proxy(req, res, next);

//     } catch (urlError) {
//         return res.status(400).json({
//             error: 'Invalid URL',
//             message: urlError.message,
//             providedUrl: targetUrl
//         });
//     }
// });

// // Default handler for non-proxy requests
// app.use((req, res) => {
//     res.status(404).json({
//         error: 'Not Found',
//         message: 'This is a CORS proxy server. Use /proxy/[URL] to proxy requests.',
//         usage: {
//             pattern: 'http://localhost:3001/proxy/[TARGET_URL]',
//             examples: [
//                 'http://localhost:3001/proxy/https://jsonplaceholder.typicode.com/posts/1',
//                 'http://localhost:3001/proxy/https://api.github.com/users/octocat',
//                 'http://localhost:3001/proxy/https://httpbin.org/get?test=123'
//             ]
//         },
//         availableEndpoints: [
//             'GET /health - Server health check'
//         ]
//     });
// });

// // Global error handler
// app.use((err, req, res, next) => {
//     if (!res.headersSent) {
//         res.status(500).json({
//             error: 'Internal Server Error',
//             message: 'An unexpected error occurred'
//         });
//     }
// });

// app.listen(PORT, () => {
//     console.log(`CORS Proxy Server running on port ${PORT}`);
// });

// module.exports = app;


// ffmpeg to m3u8


// const express = require("express");
// const { spawn } = require("child_process");
// const path = require("path");
// const fs = require("fs");

// const app = express();
// const PORT = 5000;

// // Create hls folder if not exists
// const outputDir = path.join(__dirname, "hls");
// if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// // Start FFmpeg to convert TS → HLS
// const ffmpeg = spawn("ffmpeg", [
//     "-i", "https://a1xs.vip/700001", // your raw TS stream
//     "-c:v", "copy",
//     "-c:a", "copy",
//     "-f", "hls",
//     "-hls_time", "6",
//     "-hls_list_size", "5",
//     "-hls_flags", "delete_segments",
//     path.join(outputDir, "stream.m3u8")
// ]);

// ffmpeg.stderr.on("data", data => console.log("FFmpeg:", data.toString()));
// ffmpeg.on("close", code => console.log(`FFmpeg exited with code ${code}`));

// // Serve HLS folder
// app.use("/hls", express.static(outputDir));

// app.listen(PORT, () => {
//     console.log(`Server running: http://localhost:${PORT}/hls/stream.m3u8`);
// });


// const express = require("express");
// const { spawn } = require("child_process");
// const path = require("path");
// const fs = require("fs");

// const app = express();
// const PORT = 5000;

// // Create hls folder if not exists
// const outputDir = path.join(__dirname, "hls");
// if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// // Start FFmpeg to convert TS → HLS continuously
// // const ffmpeg = spawn("ffmpeg", [
// //     "-i", "https://a1xs.vip/700001",  // raw TS stream
// //     "-c:v", "copy",
// //     "-c:a", "copy",
// //     "-f", "hls",
// //     "-hls_time", "6",                 // segment duration ~6 sec
// //     "-hls_list_size", "0",            // 0 = keep playlist updating indefinitely
// //     "-hls_flags", "delete_segments+append_list", // live mode
// //     "-hls_segment_filename", path.join(outputDir, "segment_%03d.ts"),
// //     path.join(outputDir, "stream.m3u8")
// // ]);

// const ffmpeg = spawn("ffmpeg", [
//     "-reconnect", "1",
//     "-reconnect_streamed", "1",
//     "-reconnect_delay_max", "5",
//     "-i", "https://a1xs.vip/700001",
//     "-c:v", "copy",
//     "-c:a", "copy",
//     "-f", "hls",
//     "-hls_time", "6",                 // each segment ~6 sec
//     "-hls_list_size", "5",            // only keep last 5 segments
//     "-hls_flags", "delete_segments+append_list", // delete old segments, keep playlist live
//     "-hls_segment_filename", path.join(outputDir, "segment_%03d.ts"),
//     path.join(outputDir, "stream.m3u8")
// ]);


// ffmpeg.stderr.on("data", data => console.log("FFmpeg:", data.toString()));
// ffmpeg.on("close", code => console.log(`FFmpeg exited with code ${code}`));

// // Serve HLS folder
// app.use("/hls", express.static(outputDir));

// app.listen(PORT, () => {
//     console.log(`Server running: http://localhost:${PORT}/hls/stream.m3u8`);
// });



// const express = require("express");
// const cors = require("cors");
// const { spawn } = require("child_process");
// const path = require("path");
// const fs = require("fs");

// const app = express();
// app.use(cors());  // <--- allow all origins (for testing)
// const PORT = 5000;

// // HLS output folder
// const outputDir = path.join(__dirname, "hls");
// if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// // Helper: clear old segments on startup
// fs.readdirSync(outputDir).forEach(file => {
//     if (file.endsWith(".ts") || file.endsWith(".m3u8")) {
//         fs.unlinkSync(path.join(outputDir, file));
//     }
// });

// // FFmpeg live stream setup
// const ffmpeg = spawn("ffmpeg", [
//     "-reconnect", "1",
//     "-reconnect_streamed", "1",
//     "-reconnect_delay_max", "5",
//     "-i", "https://a1xs.vip/700001", // raw TS/live stream
//     "-c:v", "copy",
//     "-c:a", "copy",
//     "-f", "hls",
//     "-hls_time", "6",                // 6s segments
//     "-hls_list_size", "3",           // only last 3 segments in playlist
//     "-hls_flags", "delete_segments+append_list",
//     "-hls_segment_filename", path.join(outputDir, "segment_%03d.ts"),
//     path.join(outputDir, "stream.m3u8")
// ]);

// ffmpeg.stderr.on("data", data => console.log("FFmpeg:", data.toString()));
// ffmpeg.on("close", code => console.log(`FFmpeg exited with code ${code}`));

// // Optional: periodically clean leftover old segments (extra safety)
// setInterval(() => {
//     const files = fs.readdirSync(outputDir).filter(f => f.endsWith(".ts"));
//     const maxSegments = 5; // keep max 5 segments
//     if (files.length > maxSegments) {
//         const toDelete = files.sort().slice(0, files.length - maxSegments);
//         toDelete.forEach(f => fs.unlinkSync(path.join(outputDir, f)));
//     }
// }, 10000); // every 10s

// // Serve HLS folder
// app.use("/hls", express.static(outputDir));

// app.listen(PORT, () => {
//     console.log(`Live HLS server running at http://localhost:${PORT}/hls/stream.m3u8`);
// });



// const express = require("express");
// const { spawn } = require("child_process");
// const path = require("path");
// const fs = require("fs");
// const cors = require("cors");

// const app = express();
// const PORT = 5000;

// // HLS output folder
// const outputDir = path.join(__dirname, "hls");
// if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// // Clear old segments on startup
// fs.readdirSync(outputDir).forEach(file => {
//     if (file.endsWith(".ts") || file.endsWith(".m3u8")) {
//         fs.unlinkSync(path.join(outputDir, file));
//     }
// });

// // FFmpeg: convert source stream → HLS
// const ffmpeg = spawn("ffmpeg", [
//     "-fflags", "+genpts",               // fix timestamps
//     "-reconnect", "1",
//     "-reconnect_streamed", "1",
//     "-reconnect_delay_max", "5",
//     "-i", "https://a1xs.vip/700001",   // raw FHD stream
//     "-c:v", "copy",
//     "-c:a", "copy",
//     "-f", "hls",
//     "-hls_time", "8",                   // 8s segments for smooth playback
//     "-hls_list_size", "5",              // keep last 5 segments
//     "-hls_flags", "delete_segments+append_list+omit_endlist",
//     "-hls_segment_filename", path.join(outputDir, "segment_%03d.ts"),
//     path.join(outputDir, "stream.m3u8")
// ]);

// ffmpeg.stderr.on("data", data => console.log("FFmpeg:", data.toString()));
// ffmpeg.on("close", code => console.log(`FFmpeg exited with code ${code}`));

// // Periodic cleanup (extra safety)
// setInterval(() => {
//     const files = fs.readdirSync(outputDir).filter(f => f.endsWith(".ts"));
//     const maxSegments = 5;
//     if (files.length > maxSegments) {
//         const toDelete = files.sort().slice(0, files.length - maxSegments);
//         toDelete.forEach(f => fs.unlinkSync(path.join(outputDir, f)));
//     }
// }, 10000);

// // Enable CORS for SPHub player
// app.use(cors({ origin: "*" })); // change "*" to your SPHub domain in production

// // Serve HLS folder
// app.use("/hls", express.static(outputDir));

// app.listen(PORT, () => {
//     console.log(`Live FHD HLS server running at http://localhost:${PORT}/hls/stream.m3u8`);
// });


// works perfectly

// const express = require("express");
// const { spawn } = require("child_process");
// const path = require("path");
// const fs = require("fs");
// const cors = require("cors");
// const fetch = require("node-fetch");

// const app = express();
// const PORT = 5000;

// const PLAYLIST_URL =
//     "https://raw.githubusercontent.com/Drewski2423/DrewLive/refs/heads/main/A1x.m3u8";

// let channels = {};
// let ffmpegProcesses = {};
// let watchers = {}; // track last access time for each tvg-id

// // Load M3U playlist
// async function loadPlaylist() {
//     const res = await fetch(PLAYLIST_URL);
//     const text = await res.text();

//     const lines = text.split("\n").map(l => l.trim());
//     let lastInfo = null;

//     // inside loadPlaylist()
//     lines.forEach(line => {
//         if (line.startsWith("#EXTINF")) {
//             const tvgId = (line.match(/tvg-id="([^"]+)"/) || [])[1];
//             const name = line.split(",").pop();
//             const logo = (line.match(/tvg-logo="([^"]+)"/) || [])[1];
//             const group = (line.match(/group-title="([^"]+)"/) || [])[1];
//             lastInfo = { tvgId, name, logo, group };
//         } else if (line && !line.startsWith("#")) {
//             if (lastInfo && lastInfo.tvgId) {
//                 channels[lastInfo.tvgId] = {
//                     id: lastInfo.tvgId,
//                     name: lastInfo.name,
//                     logo: lastInfo.logo,
//                     group: lastInfo.group,
//                     url: line
//                 };
//             }
//         }
//     });

//     console.log("Loaded channels:", Object.keys(channels).length);
// }

// // Start FFmpeg for a given tvg-id
// function startFFmpeg(tvgId) {
//     if (ffmpegProcesses[tvgId]) return;

//     const channel = channels[tvgId];
//     if (!channel) return;

//     const outputDir = path.join(__dirname, "hls", tvgId);
//     if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

//     const ffmpeg = spawn("ffmpeg", [
//         "-fflags", "+genpts",
//         "-reconnect", "1",
//         "-reconnect_streamed", "1",
//         "-reconnect_delay_max", "5",
//         "-i", channel.url,
//         "-c:v", "copy",
//         "-c:a", "copy",
//         "-f", "hls",
//         "-hls_time", "6",
//         "-hls_list_size", "5",
//         "-hls_flags", "delete_segments+append_list+omit_endlist",
//         "-hls_segment_filename", path.join(outputDir, "segment_%03d.ts"),
//         path.join(outputDir, "stream.m3u8")
//     ], {
//         stdio: ["ignore", "ignore", "ignore"] // completely silences stdout & stderr
//     });

//     // ffmpeg.stderr.on("data", data => console.log(`[${tvgId}]`, data.toString()));

//     // ffmpeg.on("close", code => {
//     //     console.log(`FFmpeg for ${tvgId} exited with code ${code}`);
//     //     delete ffmpegProcesses[tvgId];
//     // });


//     ffmpegProcesses[tvgId] = ffmpeg;
//     watchers[tvgId] = Date.now();
//     console.log(`FFmpeg started for ${tvgId}`);
// }

// // Cleanup: stop FFmpeg if no activity
// setInterval(() => {
//     const now = Date.now();
//     const timeout = 2 * 60 * 1000; // 2 minutes

//     Object.keys(watchers).forEach(tvgId => {
//         if (now - watchers[tvgId] > timeout && ffmpegProcesses[tvgId]) {
//             console.log(`Stopping FFmpeg for ${tvgId} (inactive)`);
//             ffmpegProcesses[tvgId].kill("SIGKILL");
//             delete ffmpegProcesses[tvgId];
//             delete watchers[tvgId];
//         }
//     });
// }, 60000);

// // Middleware
// app.use(cors({ origin: "*" }));

// // JSON endpoint with channel list
// app.get("/channels.json", (req, res) => {
//     const list = Object.values(channels).map(c => ({
//         id: c.id,       // tvg-id
//         name: c.name,
//         logo: c.logo,
//         group: c.group,
//         stream: `/channel/${c.id}/stream.m3u8`
//     }));
//     res.json(list);
// });


// // Serve HLS playlist
// app.get("/channel/:id/stream.m3u8", async (req, res) => {
//     const id = req.params.id;
//     const outputDir = path.join(__dirname, "hls", id);
//     const playlist = path.join(outputDir, "stream.m3u8");

//     // Start ffmpeg if not already running
//     if (!ffmpegProcesses[id]) {
//         startFFmpeg(id);
//     }

//     // Wait for stream.m3u8 to exist
//     let tries = 0;
//     while (!fs.existsSync(playlist) && tries < 20) {
//         await new Promise(r => setTimeout(r, 500)); // wait 500ms
//         tries++;
//     }

//     if (!fs.existsSync(playlist)) {
//         return res.status(500).send("Stream not ready yet. Please retry.");
//     }

//     res.sendFile(playlist);
// });


// // Serve TS segments
// app.get("/channel/:tvgId/:segment", (req, res) => {
//     const { tvgId, segment } = req.params;

//     if (!channels[tvgId]) {
//         return res.status(404).send("Channel not found");
//     }

//     watchers[tvgId] = Date.now();

//     const filePath = path.join(__dirname, "hls", tvgId, segment);
//     res.sendFile(filePath);
// });

// // Boot server
// loadPlaylist().then(() => {
//     app.listen(PORT, () => {
//         console.log(`Server running at http://localhost:${PORT}`);
//         console.log(`→ Channels JSON: http://localhost:${PORT}/channels.json`);
//         console.log(`→ Example stream: http://localhost:${PORT}/channel/SPHubCricket.au/stream.m3u8`);
//     });
// });


const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");

const app = express();
const PORT = 5000;

const PLAYLIST_URL =
    "https://raw.githubusercontent.com/Drewski2423/DrewLive/refs/heads/main/A1x.m3u8";

let channels = {};
let ffmpegProcesses = {};
let watchers = {}; // track last access time for each tvg-id

// Allowed domains for protection
const allowedDomains = ["sphublive.com", "uscore.tech", "localhost", "127.0.0.1"];

// Middleware for domain protection
// Domain protection + CORS
function domainProtection(req, res, next) {
    const origin = req.get("origin");

    if (origin) {
        const allowed = allowedDomains.some(domain => origin.includes(domain));
        if (!allowed) {
            return res.status(403).send("Forbidden: This stream can only be played on allowed domains.");
        }
        // Proper CORS header
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    }

    // Handle preflight requests
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
}



// Load M3U playlist
async function loadPlaylist() {
    const res = await fetch(PLAYLIST_URL);
    const text = await res.text();

    const lines = text.split("\n").map(l => l.trim());
    let lastInfo = null;

    lines.forEach(line => {
        if (line.startsWith("#EXTINF")) {
            const tvgId = (line.match(/tvg-id="([^"]+)"/) || [])[1];
            const name = line.split(",").pop();
            const logo = (line.match(/tvg-logo="([^"]+)"/) || [])[1];
            const group = (line.match(/group-title="([^"]+)"/) || [])[1];
            lastInfo = { tvgId, name, logo, group };
        } else if (line && !line.startsWith("#")) {
            if (lastInfo && lastInfo.tvgId) {
                channels[lastInfo.tvgId] = {
                    id: lastInfo.tvgId,
                    name: lastInfo.name,
                    logo: lastInfo.logo,
                    group: lastInfo.group,
                    url: line
                };
            }
        }
    });

    console.log("Loaded channels:", Object.keys(channels).length);
}

// Start FFmpeg for a given tvg-id
function startFFmpeg(tvgId) {
    if (ffmpegProcesses[tvgId]) return;

    const channel = channels[tvgId];
    if (!channel) return;

    const outputDir = path.join(__dirname, "hls", tvgId);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const ffmpeg = spawn("ffmpeg", [
        "-fflags", "+genpts",
        "-reconnect", "1",
        "-reconnect_streamed", "1",
        "-reconnect_delay_max", "5",
        "-i", channel.url,
        "-c:v", "copy",
        "-c:a", "copy",
        "-f", "hls",
        "-hls_time", "6",
        "-hls_list_size", "5",
        "-hls_flags", "delete_segments+append_list+omit_endlist",
        "-hls_segment_filename", path.join(outputDir, "segment_%03d.ts"),
        path.join(outputDir, "stream.m3u8")
    ], {
        stdio: ["ignore", "ignore", "ignore"] // silences FFmpeg logs
    });

    ffmpegProcesses[tvgId] = ffmpeg;
    watchers[tvgId] = Date.now();
    console.log(`FFmpeg started for ${tvgId}`);
}

// Cleanup: stop FFmpeg if no activity
setInterval(() => {
    const now = Date.now();
    const timeout = 2 * 60 * 1000; // 2 minutes

    Object.keys(watchers).forEach(tvgId => {
        if (now - watchers[tvgId] > timeout && ffmpegProcesses[tvgId]) {
            console.log(`Stopping FFmpeg for ${tvgId} (inactive)`);
            ffmpegProcesses[tvgId].kill("SIGKILL");
            delete ffmpegProcesses[tvgId];
            delete watchers[tvgId];
        }
    });
}, 60000);

// JSON endpoint with channel list
app.get("/channels.json", (req, res) => {
    const list = Object.values(channels).map(c => ({
        id: c.id,
        name: c.name,
        logo: c.logo,
        group: c.group,
        stream: `/channel/${c.id}/stream.m3u8`
    }));
    res.json(list);
});

// Serve HLS playlist with protection
app.get("/channel/:id/stream.m3u8", domainProtection, async (req, res) => {
    const id = req.params.id;
    const outputDir = path.join(__dirname, "hls", id);
    const playlist = path.join(outputDir, "stream.m3u8");

    if (!ffmpegProcesses[id]) startFFmpeg(id);

    let tries = 0;
    while (!fs.existsSync(playlist) && tries < 20) {
        await new Promise(r => setTimeout(r, 500));
        tries++;
    }

    if (!fs.existsSync(playlist)) return res.status(500).send("Stream not ready yet. Please retry.");

    watchers[id] = Date.now();
    res.sendFile(playlist);
});

// Serve TS segments with protection
app.get("/channel/:tvgId/:segment", domainProtection, (req, res) => {
    const { tvgId, segment } = req.params;
    if (!channels[tvgId]) return res.status(404).send("Channel not found");

    watchers[tvgId] = Date.now();
    const filePath = path.join(__dirname, "hls", tvgId, segment);
    res.sendFile(filePath);
});

// Boot server
loadPlaylist().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`→ Channels JSON: http://localhost:${PORT}/channels.json`);
        console.log(`→ Example stream: http://localhost:${PORT}/channel/SPHubCricket.au/stream.m3u8`);
    });
});
