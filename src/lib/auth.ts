import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";
import { sendEmail, verificationEmail, resetPasswordEmail } from "./email";
import { SITE_NAME } from "./config";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // En desarrollo el puerto puede variar (3000 ocupado → Next usa 3001)
  trustedOrigins:
    process.env.NODE_ENV === "production"
      ? undefined
      : ["http://localhost:3000", "http://localhost:3001"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Restablece tu contraseña",
        html: resetPasswordEmail(url),
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: `Confirma tu correo en ${SITE_NAME}`,
        html: verificationEmail(url),
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "SELLER",
        input: false,
      },
    },
  },
  // Rate limiting integrado de better-auth. En producción bloquea ataques de
  // fuerza bruta en login, registro y reset de contraseña.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
    customRules: {
      "/sign-in/email":          { window: 60, max: 5  },
      "/sign-up/email":          { window: 60, max: 5  },
      "/forget-password":        { window: 60, max: 3  },
      "/reset-password":         { window: 60, max: 5  },
      "/send-verification-email":{ window: 60, max: 3  },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
