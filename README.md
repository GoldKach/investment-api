# 🚀 Express API Template with Scalar Documentation

A modern, production-ready Express.js API template with TypeScript, Zod validation, Prisma ORM, and beautiful Scalar documentation.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?logo=express)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?logo=Prisma&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3068B7?logo=zod&logoColor=white)

## ✨ Features

- 🔷 **TypeScript** - Full type safety throughout the application
- 📚 **Auto-generated Documentation** - Beautiful Scalar docs from your code
- 🛡️ **Security First** - Helmet, CORS, rate limiting, and input validation
- 🗄️ **Database Ready** - Prisma ORM with type-safe queries
- ⚡ **Fast Development** - Hot reload, error handling, and logging
- 🧪 **Production Ready** - Environment validation, graceful shutdown
- 📖 **OpenAPI 3.0** - Industry standard API specification

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm or yarn
- PostgreSQL/MySQL/SQLite database

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd express-api-template
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
   ```

4. **Set up the database**

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start the development server**

   ```bash
   pnpm run dev
   ```

6. **Visit your API**
   - **Welcome Page**: http://localhost:5000
   - **API Documentation**: http://localhost:5000/docs
   - **Health Check**: http://localhost:5000/health

## 📡 API Endpoints

| Method | Endpoint            | Description            |
| ------ | ------------------- | ---------------------- |
| GET    | `/api/products`     | List all products      |
| POST   | `/api/products`     | Create a new product   |
| GET    | `/api/products/:id` | Get a specific product |
| PATCH  | `/api/products/:id` | Update a product       |
| DELETE | `/api/products/:id` | Delete a product       |

## 🛠 Adding New Endpoints - Complete Guide

Follow this step-by-step guide to add a complete **Categories** CRUD endpoint. This same pattern can be used for any new resource.

### Step 1: Update Database Schema

Add the Category model to your `prisma/schema.prisma`:

```prisma
model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  color       String?  @default("#3B82F6")
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([slug])
  @@index([isActive])
  @@map("categories")
}
```

**Run the migration:**

```bash
npx prisma migrate dev --name add-categories
npx prisma generate
```

### Step 2: Create the Categories Folder

Create the directory structure:

```bash
mkdir -p src/routes/categories
```

### Step 3: Create Category Schema

Create `src/routes/categories/categories.schema.ts`:

```typescript
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { RouteParameter } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";

// Extend Zod with OpenAPI methods
extendZodWithOpenApi(z);

export const CategorySchema = z.object({
  id: z.string().openapi({
    description: "Unique identifier for the category",
    example: "clq123abc456def789",
  }),
  name: z.string().min(1, "Category name is required").openapi({
    description: "Name of the category",
    example: "Electronics",
  }),
  slug: z.string().min(1, "Slug is required").openapi({
    description: "URL-friendly version of the category name",
    example: "electronics",
  }),
  description: z.string().optional().nullable().openapi({
    description: "Category description",
    example: "Electronic devices and gadgets",
  }),
  color: z.string().optional().openapi({
    description: "Hex color code for the category",
    example: "#3B82F6",
  }),
  isActive: z.boolean().default(true).openapi({
    description: "Whether the category is active",
    example: true,
  }),
  createdAt: z.date().openapi({
    description: "Date when the category was created",
  }),
  updatedAt: z.date().openapi({
    description: "Date when the category was last updated",
  }),
});

export const IdParamSchema: RouteParameter = z.object({
  id: z
    .string()
    .min(1, "Invalid ID format")
    .openapi({
      description: "Category ID",
      example: "clq123abc456def789",
      param: { name: "id", in: "path" },
    }),
});

export const CreateCategorySchema = CategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateCategorySchema = CategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

// Common response schemas
export const ErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.array(z.any()).optional(),
});

export const MessageSchema = z.object({
  message: z.string(),
});

// Types
export type Category = z.infer<typeof CategorySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
```

### Step 4: Create Category Handlers

Create `src/routes/categories/categories.handlers.ts`:

```typescript
import { StatusCodes } from "http-status-codes";
import { db } from "@/db/db";
import type { AppHandler } from "@/lib/types";

export const listCategories: AppHandler = async (req, res) => {
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return res.status(StatusCodes.OK).json(categories);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to fetch categories",
    });
  }
};

export const createCategory: AppHandler = async (req, res) => {
  try {
    // Generate slug from name if not provided
    if (!req.body.slug && req.body.name) {
      req.body.slug = req.body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    const category = await db.category.create({
      data: req.body,
    });
    return res.status(StatusCodes.CREATED).json(category);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(StatusCodes.CONFLICT).json({
        error: "Category with this name or slug already exists",
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to create category",
    });
  }
};

export const getCategory: AppHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await db.category.findUnique({
      where: { id },
    });

    if (!category) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Category not found",
      });
    }

    return res.status(StatusCodes.OK).json(category);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to fetch category",
    });
  }
};

export const updateCategory: AppHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const existingCategory = await db.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Category not found",
      });
    }

    // Generate slug from name if name is being updated but slug is not provided
    if (req.body.name && !req.body.slug) {
      req.body.slug = req.body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    const updatedCategory = await db.category.update({
      where: { id },
      data: req.body,
    });

    return res.status(StatusCodes.OK).json(updatedCategory);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(StatusCodes.CONFLICT).json({
        error: "Category with this name or slug already exists",
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to update category",
    });
  }
};

export const deleteCategory: AppHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const existingCategory = await db.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Category not found",
      });
    }

    // Soft delete by setting isActive to false
    await db.category.update({
      where: { id },
      data: { isActive: false },
    });

    return res.status(StatusCodes.OK).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to delete category",
    });
  }
};
```

### Step 5: Create Category Routes

Create `src/routes/categories/categories.routes.ts`:

```typescript
import { IRouter, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { validateRequest } from "@/lib/validation";
import { createRoute } from "@/lib/create-route";
import {
  CategorySchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  IdParamSchema,
  ErrorSchema,
  MessageSchema,
} from "./categories.schema";
import * as handlers from "./categories.handlers";

const router: IRouter = Router();

// Routes
router.get("/", handlers.listCategories);
router.post(
  "/",
  validateRequest({ body: CreateCategorySchema }),
  handlers.createCategory
);
router.get(
  "/:id",
  validateRequest({ params: IdParamSchema }),
  handlers.getCategory
);
router.patch(
  "/:id",
  validateRequest({ params: IdParamSchema, body: UpdateCategorySchema }),
  handlers.updateCategory
);
router.delete(
  "/:id",
  validateRequest({ params: IdParamSchema }),
  handlers.deleteCategory
);

// OpenAPI definitions
export const categoriesOpenAPI = [
  createRoute({
    method: "get",
    path: "/api/categories",
    tags: ["Categories"],
    summary: "List all categories",
    responses: {
      [StatusCodes.OK]: {
        description: "List of categories",
        content: { "application/json": { schema: CategorySchema.array() } },
      },
      [StatusCodes.INTERNAL_SERVER_ERROR]: {
        description: "Server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),

  createRoute({
    method: "post",
    path: "/api/categories",
    tags: ["Categories"],
    summary: "Create a new category",
    request: {
      body: {
        content: { "application/json": { schema: CreateCategorySchema } },
        description: "Category data",
      },
    },
    responses: {
      [StatusCodes.CREATED]: {
        description: "Category created",
        content: { "application/json": { schema: CategorySchema } },
      },
      [StatusCodes.CONFLICT]: {
        description: "Category already exists",
        content: { "application/json": { schema: ErrorSchema } },
      },
      [StatusCodes.UNPROCESSABLE_ENTITY]: {
        description: "Validation error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),

  createRoute({
    method: "get",
    path: "/api/categories/{id}",
    tags: ["Categories"],
    summary: "Get a category by ID",
    request: { params: IdParamSchema },
    responses: {
      [StatusCodes.OK]: {
        description: "Category found",
        content: { "application/json": { schema: CategorySchema } },
      },
      [StatusCodes.NOT_FOUND]: {
        description: "Category not found",
        content: { "application/json": { schema: MessageSchema } },
      },
    },
  }),

  createRoute({
    method: "patch",
    path: "/api/categories/{id}",
    tags: ["Categories"],
    summary: "Update a category",
    request: {
      params: IdParamSchema,
      body: {
        content: { "application/json": { schema: UpdateCategorySchema } },
        description: "Category updates",
      },
    },
    responses: {
      [StatusCodes.OK]: {
        description: "Category updated",
        content: { "application/json": { schema: CategorySchema } },
      },
      [StatusCodes.NOT_FOUND]: {
        description: "Category not found",
        content: { "application/json": { schema: MessageSchema } },
      },
      [StatusCodes.CONFLICT]: {
        description: "Category name/slug conflict",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),

  createRoute({
    method: "delete",
    path: "/api/categories/{id}",
    tags: ["Categories"],
    summary: "Delete a category",
    request: { params: IdParamSchema },
    responses: {
      [StatusCodes.OK]: {
        description: "Category deleted",
        content: { "application/json": { schema: MessageSchema } },
      },
      [StatusCodes.NOT_FOUND]: {
        description: "Category not found",
        content: { "application/json": { schema: MessageSchema } },
      },
    },
  }),
];

export default router;
```

### Step 6: Register Routes in App

Update `src/app.ts` to include the new routes:

```typescript
// Add this import
import categoriesRouter, {
  categoriesOpenAPI,
} from "./routes/categories/categories.routes";

// Register OpenAPI definitions (add this line)
registerOpenAPIRoutes(categoriesOpenAPI);

// Register routes (add this line)
app.use("/api/categories", categoriesRouter);
```

### Step 7: Update Welcome Page

Update the endpoints list in `src/app.ts` welcome page:

```html
<div class="endpoint">
  <span class="method">GET</span>/api/categories - List all categories
</div>
<div class="endpoint">
  <span class="method">POST</span>/api/categories - Create a new category
</div>
<div class="endpoint">
  <span class="method">GET</span>/api/categories/:id - Get a category
</div>
<div class="endpoint">
  <span class="method">PATCH</span>/api/categories/:id - Update a category
</div>
<div class="endpoint">
  <span class="method">DELETE</span>/api/categories/:id - Delete a category
</div>
```

### Step 8: Test Your New Endpoints

1. **Restart your server**:

   ```bash
   pnpm run dev
   ```

2. **Visit the documentation**: http://localhost:5000/docs

3. **Test the endpoints**:

   ```bash
   # Create a category
   curl -X POST http://localhost:5000/api/categories \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Electronics",
       "description": "Electronic devices and gadgets",
       "color": "#3B82F6"
     }'

   # Get all categories
   curl http://localhost:5000/api/categories

   # Get a specific category
   curl http://localhost:5000/api/categories/{category-id}

   # Update a category
   curl -X PATCH http://localhost:5000/api/categories/{category-id} \
     -H "Content-Type: application/json" \
     -d '{"description": "Updated description"}'

   # Delete a category
   curl -X DELETE http://localhost:5000/api/categories/{category-id}
   ```

## 📁 Project Structure

```
src/
├── lib/
│   ├── types.ts              # TypeScript type definitions
│   ├── validation.ts         # Zod validation middleware
│   ├── create-route.ts       # Custom createRoute helper
│   ├── openapi-config.ts     # OpenAPI configuration
│   └── openapi-registry.ts   # OpenAPI routes registry
├── middleware/
│   ├── error-handler.ts      # Global error handler
│   └── not-found.ts         # 404 handler
├── routes/
│   ├── products/            # Products endpoints
│   │   ├── products.schema.ts
│   │   ├── products.handlers.ts
│   │   └── products.routes.ts
│   └── categories/          # Categories endpoints
│       ├── categories.schema.ts
│       ├── categories.handlers.ts
│       └── categories.routes.ts
├── db/
│   └── db.ts               # Database client
├── app.ts                  # Express app setup
└── index.ts               # Server entry point
```

## 🎯 Quick Checklist for New Endpoints

When adding a new resource (e.g., `users`, `orders`, etc.), follow this checklist:

- [ ] **1. Database Schema** - Add model to `prisma/schema.prisma`
- [ ] **2. Run Migration** - `npx prisma migrate dev --name add-{resource}`
- [ ] **3. Create Folder** - `src/routes/{resource}/`
- [ ] **4. Schema File** - `{resource}.schema.ts` with Zod schemas
- [ ] **5. Handlers File** - `{resource}.handlers.ts` with CRUD operations
- [ ] **6. Routes File** - `{resource}.routes.ts` with Express routes + OpenAPI
- [ ] **7. Register in App** - Add import and routes to `src/app.ts`
- [ ] **8. Update Welcome** - Add endpoints to welcome page
- [ ] **9. Test** - Restart server and test all endpoints
- [ ] **10. Documentation** - Verify in Scalar docs at `/docs`

## 🔧 Configuration

### Environment Variables

| Variable       | Description                | Default       |
| -------------- | -------------------------- | ------------- |
| `NODE_ENV`     | Environment mode           | `development` |
| `PORT`         | Server port                | `5000`        |
| `DATABASE_URL` | Database connection string | Required      |

### Dependencies

**Core Dependencies:**

- `express` - Web framework
- `typescript` - Type safety
- `zod` - Schema validation
- `prisma` - Database ORM
- `@asteasolutions/zod-to-openapi` - OpenAPI generation
- `@scalar/express-api-reference` - API documentation
- `http-status-codes` - HTTP status constants

## 🚀 Deployment

### Build for Production

```bash
pnpm run build
pnpm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm ci --only=production
COPY . .
RUN pnpm run build
EXPOSE 5000
CMD ["pnpm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

---

**Happy coding! 🚀**

For questions or support, please open an issue on GitHub.
