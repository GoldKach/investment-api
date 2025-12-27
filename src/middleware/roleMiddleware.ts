import { Request, Response, NextFunction } from "express";

/* ─────────────────────────────────────────────────────────────────────────────
   ROLE-BASED ACCESS CONTROL MIDDLEWARE
   ───────────────────────────────────────────────────────────────────────────── */

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
}

/**
 * Middleware to require specific roles for accessing a route
 * @param allowedRoles - Array of roles that can access the route
 * @returns Express middleware function
 * 
 * @example
 * // Single role
 * router.get('/admin', requireRole(['SUPER_ADMIN']), controller);
 * 
 * // Multiple roles
 * router.get('/manage', requireRole(['SUPER_ADMIN', 'ADMIN', 'MANAGER']), controller);
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "Please login to access this resource",
      });
    }

    // Check if user has required role
    const userRole = req.user.role;

    if (!userRole) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
        message: "User role not found",
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
        message: `This action requires one of the following roles: ${allowedRoles.join(", ")}`,
        requiredRoles: allowedRoles,
        userRole: userRole,
      });
    }

    // User has required role, proceed
    next();
  };
}

/**
 * Middleware to require SUPER_ADMIN role
 * Shortcut for requireRole(['SUPER_ADMIN'])
 */
export function requireSuperAdmin() {
  return requireRole(["SUPER_ADMIN"]);
}

/**
 * Middleware to require admin-level access (SUPER_ADMIN or ADMIN)
 */
export function requireAdmin() {
  return requireRole(["SUPER_ADMIN", "ADMIN"]);
}

/**
 * Middleware to require manager-level access (SUPER_ADMIN, ADMIN, or MANAGER)
 */
export function requireManager() {
  return requireRole(["SUPER_ADMIN", "ADMIN", "MANAGER"]);
}

/**
 * Middleware to check if user owns the resource or is admin
 * @param getResourceOwnerId - Function to extract owner ID from request
 */
export function requireOwnerOrAdmin(getResourceOwnerId: (req: Request) => string | Promise<string>) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Admins can access any resource
    if (["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) {
      return next();
    }

    try {
      const ownerId = await getResourceOwnerId(req);
      
      if (req.user.id === ownerId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: "Access denied",
        message: "You can only access your own resources",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to verify resource ownership",
      });
    }
  };
}