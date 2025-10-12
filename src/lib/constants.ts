export const ZOD_ERROR_MESSAGES = {
  REQUIRED: "Required",
  EXPECTED_NUMBER: "Expected number, received nan",
  NO_UPDATES: "No updates provided",
};

export const ZOD_ERROR_CODES = {
  INVALID_UPDATES: "invalid_updates",
};

export const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Express API with Scalar Docs</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style type="text/tailwindcss">
        @theme {
            --color-primary-50: #f0f9ff;
            --color-primary-100: #e0f2fe;
            --color-primary-200: #bae6fd;
            --color-primary-300: #7dd3fc;
            --color-primary-400: #38bdf8;
            --color-primary-500: #0ea5e9;
            --color-primary-600: #0284c7;
            --color-primary-700: #0369a1;
            --color-primary-800: #075985;
            --color-primary-900: #0c4a6e;
            
            --color-secondary-50: #f8fafc;
            --color-secondary-100: #f1f5f9;
            --color-secondary-200: #e2e8f0;
            --color-secondary-300: #cbd5e1;
            --color-secondary-400: #94a3b8;
            --color-secondary-500: #64748b;
            --color-secondary-600: #475569;
            --color-secondary-700: #334155;
            --color-secondary-800: #1e293b;
            --color-secondary-900: #0f172a;
            
            --font-family-sans: "Inter", sans-serif;
            
            --animation-float: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .gradient-text {
            background: linear-gradient(to right, var(--color-primary-600), var(--color-primary-400));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }
        
        .gradient-bg {
            background: linear-gradient(to right, var(--color-primary-600), var(--color-primary-500));
        }
        
        .code-block {
            background: var(--color-secondary-900);
            color: var(--color-gray-100);
            padding: 1.5rem;
            border-radius: 0.5rem;
            font-family: monospace;
            font-size: 0.875rem;
            overflow-x: auto;
        }
        
        .endpoint {
            background: var(--color-gray-50);
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 0.5rem;
            border-left: 4px solid var(--color-green-500);
        }
        
        .endpoint .method {
            font-weight: bold;
            color: var(--color-green-500);
            margin-right: 0.75rem;
        }
    </style>
</head>
<body class="bg-gradient-to-br from-primary-900 to-primary-700 min-h-screen font-sans text-gray-800 dark:text-gray-100">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden transition-all duration-300">
            <!-- Header -->
            <div class="gradient-bg text-white px-8 py-12 text-center">
                <div class="max-w-3xl mx-auto">
                    <h1 class="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center">
                        <span class="animate-[float_3s_ease-in-out_infinite] mr-3">🚀</span> 
                        <span>Express API Template</span>
                    </h1>
                    <p class="text-xl text-primary-100 opacity-90">
                        A modern Express.js API with TypeScript, Zod validation, and beautiful Scalar documentation
                    </p>
                </div>
            </div>
            
            <!-- Content -->
            <div class="px-6 py-8 md:px-8 md:py-12">
                <!-- Quick Start -->
                <section class="mb-12">
                    <h2 class="text-3xl font-bold gradient-text mb-6">🎯 Quick Start</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow duration-300 border-l-4 border-primary-500">
                            <div class="text-3xl mb-4 gradient-text">📖</div>
                            <h3 class="text-xl font-semibold mb-3">API Documentation</h3>
                            <p class="text-gray-600 dark:text-gray-300 mb-4">
                                Explore our interactive API documentation powered by Scalar. Test endpoints, view schemas, and see examples.
                            </p>
                            <a href="/docs" class="gradient-bg text-white px-5 py-2.5 rounded-lg font-medium inline-block hover:shadow-lg transition-all duration-300">
                                View API Docs
                            </a>
                        </div>
                        
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow duration-300 border-l-4 border-secondary-500">
                            <div class="text-3xl mb-4 gradient-text">📋</div>
                            <h3 class="text-xl font-semibold mb-3">OpenAPI Spec</h3>
                            <p class="text-gray-600 dark:text-gray-300 mb-4">
                                Download the complete OpenAPI 3.0 specification for integration with other tools and services.
                            </p>
                            <a href="/docs/openapi.json" class="bg-secondary-600 hover:bg-secondary-700 text-white px-5 py-2.5 rounded-lg font-medium inline-block hover:shadow-lg transition-all duration-300">
                                Download Spec
                            </a>
                        </div>
                        
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow duration-300 border-l-4 border-green-500">
                            <div class="text-3xl mb-4 gradient-text">💚</div>
                            <h3 class="text-xl font-semibold mb-3">Health Check</h3>
                            <p class="text-gray-600 dark:text-gray-300 mb-4">
                                Monitor the API status and uptime with our health check endpoint.
                            </p>
                            <a href="/health" class="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium inline-block hover:shadow-lg transition-all duration-300">
                                Check Health
                            </a>
                        </div>
                    </div>
                </section>
                
                <!-- Installation -->
                <section class="mb-12">
                    <h2 class="text-3xl font-bold gradient-text mb-6">🛠 Installation</h2>
                    <p class="text-gray-700 dark:text-gray-300 mb-4">Get started with this API template in minutes:</p>
                    
                    <div class="code-block">
                        <pre><code># Clone the repository
git clone &lt;your-repo-url&gt;
cd express-api-template

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and other settings

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev</code></pre>
                    </div>
                </section>
                
                <!-- Endpoints -->
                <section class="mb-12">
                    <h2 class="text-3xl font-bold gradient-text mb-6">📡 Available Endpoints</h2>
                    <p class="text-gray-700 dark:text-gray-300 mb-4">Current API endpoints available in this template:</p>
                    
                    <div class="space-y-3">
                        <div class="endpoint">
                            <span class="method">GET</span>/api/products - List all products
                        </div>
                        <div class="endpoint">
                            <span class="method">POST</span>/api/products - Create a new product
                        </div>
                        <div class="endpoint">
                            <span class="method">GET</span>/api/products/:id - Get a specific product
                        </div>
                        <div class="endpoint">
                            <span class="method">PATCH</span>/api/products/:id - Update a product
                        </div>
                        <div class="endpoint">
                            <span class="method">DELETE</span>/api/products/:id - Delete a product
                        </div>
                    </div>
                </section>
                
                <!-- Features -->
                <section class="mb-12">
                    <h2 class="text-3xl font-bold gradient-text mb-6">✨ Features</h2>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors duration-300 text-center">
                            <div class="text-5xl gradient-text mb-4">⚡</div>
                            <h3 class="text-xl font-semibold mb-2">TypeScript</h3>
                            <p class="text-gray-600 dark:text-gray-300">Full type safety with TypeScript and Zod schema validation</p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors duration-300 text-center">
                            <div class="text-5xl gradient-text mb-4">📚</div>
                            <h3 class="text-xl font-semibold mb-2">Auto Docs</h3>
                            <p class="text-gray-600 dark:text-gray-300">Automatically generated OpenAPI documentation with Scalar</p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors duration-300 text-center">
                            <div class="text-5xl gradient-text mb-4">🛡️</div>
                            <h3 class="text-xl font-semibold mb-2">Security</h3>
                            <p class="text-gray-600 dark:text-gray-300">Built-in security with Helmet, CORS, and rate limiting</p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors duration-300 text-center">
                            <div class="text-5xl gradient-text mb-4">🗄️</div>
                            <h3 class="text-xl font-semibold mb-2">Database</h3>
                            <p class="text-gray-600 dark:text-gray-300">Prisma ORM for type-safe database operations</p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors duration-300 text-center">
                            <div class="text-5xl gradient-text mb-4">🔄</div>
                            <h3 class="text-xl font-semibold mb-2">Validation</h3>
                            <p class="text-gray-600 dark:text-gray-300">Request/response validation with detailed error messages</p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors duration-300 text-center">
                            <div class="text-5xl gradient-text mb-4">🚀</div>
                            <h3 class="text-xl font-semibold mb-2">Production Ready</h3>
                            <p class="text-gray-600 dark:text-gray-300">Logging, error handling, and performance optimizations</p>
                        </div>
                    </div>
                </section>
                
                <!-- Tech Stack -->
                <section class="mb-12">
                    <h2 class="text-3xl font-bold gradient-text mb-6">🔧 Tech Stack</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow duration-300 border-l-4 border-blue-500">
                            <h3 class="text-xl font-semibold mb-4 gradient-text">Backend</h3>
                            <ul class="space-y-2">
                                <li class="flex items-start">
                                    <span class="text-primary-500 mr-2">•</span>
                                    <span><strong>Express.js</strong> - Fast, unopinionated web framework</span>
                                </li>
                                <li class="flex items-start">
                                    <span class="text-primary-500 mr-2">•</span>
                                    <span><strong>TypeScript</strong> - Type-safe JavaScript development</span>
                                </li>
                                <li class="flex items-start">
                                    <span class="text-primary-500 mr-2">•</span>
                                    <span><strong>Zod</strong> - Runtime type validation and parsing</span>
                                </li>
                            </ul>
                        </div>
                        
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow duration-300 border-l-4 border-purple-500">
                            <h3 class="text-xl font-semibold mb-4 gradient-text">Documentation</h3>
                            <ul class="space-y-2">
                                <li class="flex items-start">
                                    <span class="text-primary-500 mr-2">•</span>
                                    <span><strong>OpenAPI 3.0</strong> - Industry standard API specification</span>
                                </li>
                                <li class="flex items-start">
                                    <span class="text-primary-500 mr-2">•</span>
                                    <span><strong>Scalar</strong> - Beautiful, interactive documentation</span>
                                </li>
                                <li class="flex items-start">
                                    <span class="text-primary-500 mr-2">•</span>
                                    <span><strong>Auto-generation</strong> - Docs generated from code</span>
                                </li>
                            </ul>
                        </div>
                        
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow duration-300 border-l-4 border-green-500">
                            <h3 class="text-xl font-semibold mb-4 gradient-text">Database & Security</h3>
                            <ul class="space-y-2">
                                <li class="flex items-start">
                                    <span class="text-primary-500 mr-2">•</span>
                                    <span><strong>Prisma</strong> - Type-safe database client</span>
                                </li>
                                <li class="flex items-start">
                                    <span class="text-primary-500 mr-2">•</span>
                                    <span><strong>Helmet</strong> - Security middleware</span>
                                </li>
                                <li class="flex items-start">
                                    <span class="text-primary-500 mr-2">•</span>
                                    <span><strong>Rate Limiting</strong> - API protection</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>
                
                <!-- Next Steps -->
                <section class="mb-8">
                    <h2 class="text-3xl font-bold gradient-text mb-6">📝 Next Steps</h2>
                    <p class="text-gray-700 dark:text-gray-300 mb-4">Ready to extend this API? Check out the README.md for detailed guides on:</p>
                    <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Adding new endpoints (e.g., Categories)</li>
                        <li>Creating middleware</li>
                        <li>Database schema changes</li>
                        <li>Authentication setup</li>
                        <li>Deployment strategies</li>
                    </ul>
                </section>
            </div>
            
            <!-- Footer -->
            <div class="bg-gray-900 text-gray-300 text-center py-6 px-4">
                <p>Built with ❤️ using Express.js, TypeScript, and Scalar • <a href="https://github.com" class="text-primary-400 hover:text-primary-300 transition-colors duration-300">View on GitHub</a></p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
