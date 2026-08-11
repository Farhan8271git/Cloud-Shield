import { z } from "zod";

export const registerSchema = z.object({
    fullName: z.string()
    .trim().min(3, "Full name must contain at least 3 letters")
    .max(100, "Full name must not exceed 100 letters"),

    email: z.string().trim().email("Please enter valid email address"),

    password: z.string().min(8, "Password must be at least 8 characters long"),

    confirmPassword: z.string(),
})

.refine((data) => data.password === data.confirmPassword,{
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export const LoginSchema = z.object({
    email: z.string().trim().email("please enter valid email address"),

    password: z.string().min(1, "password  is required"),
});