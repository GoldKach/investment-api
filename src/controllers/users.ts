

// import { db } from "@/db/db";
// import { Request, Response } from "express";
// import bcrypt from "bcrypt";
// import { generateAccessToken, generateRefreshToken, TokenPayload } from "@/utils/tokens";
// import { AuthRequest } from "@/utils/auth";

// // ----------------------
// // CREATE USER
// // ----------------------
// export async function createUser(req: Request, res: Response) {
//   const { email, image, phone, password, firstName, lastName, role, status} = req.body;

//   try {
//     // Check if email or phone already exists
//     const existingUser = await db.user.findFirst({
//       where: {
//         OR: [
//           { email },
//           { phone }
//         ]
//       }
//     });
//     if (existingUser) {
//       return res.status(409).json({ data: null, error: "User with this email or phone already exists" });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = await db.user.create({
//       data: {
//         email,
//         phone,
//         image: image || "https://y2fxfl5cnq.ufs.sh/f/NMmMr48gm28W8uLodAOyiZJafIVQ6TpdgKRrwk39xvLPlh1b",
//         password: hashedPassword,
//         firstName,
//         lastName,
//         role,
//         status: status || "ACTIVE",
//       }
//     });

//     const { password: _, ...userWithoutPassword } = newUser;

//     return res.status(201).json({ data: userWithoutPassword, error: null });

//   } catch (error) {
//     console.error("Error creating user:", error);
//     return res.status(500).json({ data: null, error: "Something went wrong" });
//   }
// }

// // ----------------------
// // LOGIN USER
// // ----------------------
// // login user with email or phone
// export async function loginUser(req: Request, res: Response) {
//   const { identifier, password } = req.body; // identifier can be email or phone

//   try {
//     // Find user by email or phone
//     const user = await db.user.findFirst({
//       where: {
//         OR: [
//           { email: identifier },
//           { phone: identifier }
//         ]
//       }
//     });

//     if (!user) {
//       return res.status(401).json({ data: null, error: "Invalid credentials" });
//     }

//     // Check if account is active
//     if (user.status !== "ACTIVE") {
//       return res.status(403).json({ data: null, error: "User account is not active" });
//     }

//     // Verify password
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(401).json({ data: null, error: "Invalid credentials" });
//     }

//     // Generate JWT tokens
//     const payload: TokenPayload = {
//       userId: user.id,
//       phone: user.phone,
//       email: user.email,
//       role: user.role,
//     };

//     const accessToken = generateAccessToken(payload);
//     const refreshToken = generateRefreshToken(payload);

//     // Save refresh token in DB
//     await db.refreshToken.create({
//       data: {
//         token: refreshToken,
//         userId: user.id,
//         expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
//       },
//     });

//     // Exclude password before sending to frontend
//     const { password: _, ...userWithoutPassword } = user;

//     return res.status(200).json({
//       data: { user: userWithoutPassword, accessToken, refreshToken },
//       error: null,
//     });

//   } catch (error) {
//     console.error("Login error:", error);
//     return res.status(500).json({ data: null, error: "An error occurred during login" });
//   }
// }


// // ----------------------
// // GET ALL USERS
// // ----------------------
// export async function getAllUsers(req: AuthRequest, res: Response) {
//   try {
//     const users = await db.user.findMany({
//       orderBy: { createdAt: "desc" },
//       include: {
//         refreshTokens: false,
//         watchEvents: true,
//         downloadEvents: true,
//       }
//     });
//     return res.status(200).json({ data: users, error: null });
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     return res.status(500).json({ data: null, error: "Failed to fetch users" });
//   }
// }

// // ----------------------
// // GET CURRENT USER
// // ----------------------
// export async function getCurrentUser(req: AuthRequest, res: Response) {
//   try {
//     const user = await db.user.findUnique({
//       where: { id: req.user?.userId },
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//         email: true,
//         phone: true,
//         image: true,
//         role: true,
//         status: true,
//       }
//     });

//     if (!user) return res.status(404).json({ data: null, error: "User not found" });

//     return res.status(200).json({ data: user, error: null });

//   } catch (error) {
//     console.error("Error fetching current user:", error);
//     return res.status(500).json({ data: null, error: "Server error" });
//   }
// }

// // ----------------------
// // DELETE USER
// // ----------------------
// export async function deleteUser(req: AuthRequest, res: Response) {
//   const { id } = req.params;

//   try {
//     const existingUser = await db.user.findUnique({ where: { id } });
//     if (!existingUser) return res.status(404).json({ data: null, error: "User not found" });

//     // Soft delete: update status to DEACTIVATED
//     await db.user.update({
//       where: { id },
//       data: { status: "DEACTIVATED" }
//     });

//     return res.status(200).json({ data: null, message: "User deactivated successfully" });

//   } catch (error) {
//     console.error("Error deleting user:", error);
//     return res.status(500).json({ data: null, error: "Failed to delete user" });
//   }
// }


// // ----------------------
// // GET USER BY ID
// // ----------------------
// export async function getUserById(req: AuthRequest, res: Response) {
//   const { id } = req.params;

//   try {
//     const user = await db.user.findUnique({
//       where: { id },
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//         email: true,
//         phone: true,
//         image: true,
//         role: true,
//         status: true,
//         createdAt: true,
//         updatedAt: true,
//       }
//     });

//     if (!user) {
//       return res.status(404).json({ data: null, error: "User not found" });
//     }

//     return res.status(200).json({ data: user, error: null });

//   } catch (error) {
//     console.error("Error fetching user by id:", error);
//     return res.status(500).json({ data: null, error: "Server error" });
//   }
// }


// // ----------------------
// // UPDATE/EDIT USER
// // ----------------------
// export async function updateUser(req: AuthRequest, res: Response) {
//   const { id } = req.params;
//   const { firstName, lastName, email, phone, role, status, schoolId, password, image } = req.body;

//   try {
//     const existingUser = await db.user.findUnique({ where: { id } });
//     if (!existingUser) {
//       return res.status(404).json({ data: null, error: "User not found" });
//     }

//     // Check if email or phone already exists for other users
//     if (email || phone) {
//       const conflictUser = await db.user.findFirst({
//         where: {
//           OR: [
//             { email: email || undefined },
//             { phone: phone || undefined }
//           ],
//           NOT: { id } // exclude current user
//         }
//       });

//       if (conflictUser) {
//         return res.status(409).json({ data: null, error: "Email or phone already in use by another user" });
//       }
//     }

//     // Hash new password if provided
//     const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

//     const updatedUser = await db.user.update({
//       where: { id },
//       data: {
//         firstName: firstName || existingUser.firstName,
//         lastName: lastName || existingUser.lastName,
//         email: email || existingUser.email,
//         phone: phone || existingUser.phone,
//         role: role || existingUser.role,
//         status: status || existingUser.status,
//         password: hashedPassword || existingUser.password,
//         image: image || existingUser.image,
//       },
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//         email: true,
//         phone: true,
//         role: true,
//         status: true,
//         image: true,
//         createdAt: true,
//         updatedAt: true,
//       }
//     });

//     return res.status(200).json({ data: updatedUser, error: null });

//   } catch (error) {
//     console.error("Error updating user:", error);
//     return res.status(500).json({ data: null, error: "Failed to update user" });
//   }
// }




import { db } from "@/db/db";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  TokenPayload,
} from "@/utils/tokens";
import { AuthRequest } from "@/utils/auth";
import { UserRole } from "@prisma/client";

/* Helpers */
const isValidRole = (v: any): v is UserRole =>
  Object.values(UserRole).includes(v as UserRole);

const DEFAULT_AVATAR =
  "https://y2fxfl5cnq.ufs.sh/f/NMmMr48gm28W8uLodAOyiZJafIVQ6TpdgKRrwk39xvLPlh1b";

/* ======================
   CREATE USER
====================== */
export async function createUser(req: Request, res: Response) {
  const {
    email,
    imageUrl,
    phone,
    password,
    firstName,
    lastName,
    role,
    isActive, // optional boolean
  } = req.body as {
    email: string;
    phone: string;
    password: string;
    firstName: string;
    lastName: string;
    imageUrl?: string;
    role?: UserRole | string;
    isActive?: boolean;
  };

  try {
    if (!email || !phone || !password || !firstName || !lastName) {
      return res.status(400).json({ data: null, error: "Missing required fields." });
    }

    const emailNorm = email.trim().toLowerCase();
    const phoneNorm = phone.trim();

    // Unique checks
    const existingUser = await db.user.findFirst({
      where: { OR: [{ email: emailNorm }, { phone: phoneNorm }] },
      select: { id: true },
    });
    if (existingUser) {
      return res
        .status(409)
        .json({ data: null, error: "User with this email or phone already exists" });
    }

    const roleValue: UserRole = isValidRole(role) ? (role as UserRole) : UserRole.USER;
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await db.user.create({
      data: {
        email: emailNorm,
        phone: phoneNorm,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        imageUrl: imageUrl ?? DEFAULT_AVATAR,
        password: hashedPassword,
        role: roleValue,
        isActive: isActive ?? false, // default off until you activate/verify
        emailVerified: false,
        isApproved: false,
      },
    });

    const { password: _pw, ...safe } = newUser;
    return res.status(201).json({ data: safe, error: null });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ data: null, error: "Something went wrong" });
  }
}

/* ======================
   LOGIN USER (email or phone)
====================== */
export async function loginUser(req: Request, res: Response) {
  const { identifier, password } = req.body as { identifier: string; password: string };

  try {
    if (!identifier || !password) {
      return res.status(400).json({ data: null, error: "Missing credentials" });
    }

    const idNorm = identifier.trim().toLowerCase();
    const user = await db.user.findFirst({
      where: {
        OR: [{ email: idNorm }, { phone: identifier.trim() }],
      },
    });

    if (!user) {
      return res.status(401).json({ data: null, error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ data: null, error: "User account is not active" });
    }

    if (!user.password) {
      return res
        .status(401)
        .json({ data: null, error: "This account has no password. Use social login or reset password." });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ data: null, error: "Invalid credentials" });
    }

    const payload: TokenPayload = {
      userId: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await db.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const { password: _pw, ...safe } = user;
    return res.status(200).json({
      data: { user: safe, accessToken, refreshToken },
      error: null,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ data: null, error: "An error occurred during login" });
  }
}

/* ======================
   GET ALL USERS
====================== */
export async function getAllUsers(req: AuthRequest, res: Response) {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        accounts: true,
        sessions: false,
        refreshTokens: false,
      },
    });
    const safe = users.map(({ password:any, ...u }) => u);
    return res.status(200).json({ data: safe, error: null });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ data: null, error: "Failed to fetch users" });
  }
}

/* ======================
   GET CURRENT USER
====================== */
export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ data: null, error: "Unauthorized" });
    }

    const user = await db.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        phone: true,
        imageUrl: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return res.status(404).json({ data: null, error: "User not found" });
    return res.status(200).json({ data: user, error: null });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({ data: null, error: "Server error" });
  }
}

/* ======================
   SOFT DELETE USER
====================== */
export async function deleteUser(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) return res.status(404).json({ data: null, error: "User not found" });

    await db.user.update({
      where: { id },
      data: { isActive: false },
    });

    return res.status(200).json({ data: null, message: "User deactivated successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ data: null, error: "Failed to delete user" });
  }
}

/* ======================
   GET USER BY ID
====================== */
export async function getUserById(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        phone: true,
        imageUrl: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ data: null, error: "User not found" });
    }

    return res.status(200).json({ data: user, error: null });
  } catch (error) {
    console.error("Error fetching user by id:", error);
    return res.status(500).json({ data: null, error: "Server error" });
  }
}

/* ======================
   UPDATE USER
====================== */
export async function updateUser(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { firstName, lastName, email, phone, role, isActive, password, imageUrl } = req.body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: UserRole | string;
    isActive?: boolean;
    password?: string;
    imageUrl?: string;
  };

  try {
    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ data: null, error: "User not found" });
    }

    // Uniqueness checks for email/phone
    if (email || phone) {
      const emailNorm = email?.trim().toLowerCase();
      const phoneNorm = phone?.trim();
      const conflictUser = await db.user.findFirst({
        where: {
          OR: [{ email: emailNorm ?? undefined }, { phone: phoneNorm ?? undefined }],
          NOT: { id },
        },
        select: { id: true },
      });
      if (conflictUser) {
        return res
          .status(409)
          .json({ data: null, error: "Email or phone already in use by another user" });
      }
    }

    const roleValue =
      role !== undefined ? (isValidRole(role) ? (role as UserRole) : undefined) : undefined;
    const hashedPassword = password ? await bcrypt.hash(password, 12) : undefined;

    const nextFirst = firstName ?? existingUser.firstName;
    const nextLast = lastName ?? existingUser.lastName;

    const updatedUser = await db.user.update({
      where: { id },
      data: {
        firstName: nextFirst,
        lastName: nextLast,
        name: `${nextFirst} ${nextLast}`.trim(),
        email: email ? email.trim().toLowerCase() : existingUser.email,
        phone: phone ? phone.trim() : existingUser.phone,
        role: roleValue ?? existingUser.role,
        isActive: typeof isActive === "boolean" ? isActive : existingUser.isActive,
        password: hashedPassword ?? existingUser.password,
        imageUrl: imageUrl ?? existingUser.imageUrl ?? DEFAULT_AVATAR,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ data: updatedUser, error: null });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ data: null, error: "Failed to update user" });
  }
}
