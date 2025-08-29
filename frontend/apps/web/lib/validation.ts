import { z } from 'zod'

const loginFormSchema = z.object({
  username: z.string().min(1, 'Please enter your username or email'),
  password: z.string().min(8)
})

const registerFormSchema = z
  .object({
    username: z.string().min(3),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8),
    passwordRetype: z.string().min(8),
    // Optional social media links
    instagram: z.string().url().optional().or(z.literal('')),
    facebook: z.string().url().optional().or(z.literal('')),
    pinterest: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
    tiktok: z.string().url().optional().or(z.literal('')),
    youtube: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal(''))
  })
  .refine((data) => data.password === data.passwordRetype, {
    message: 'Passwords are not matching',
    path: ['passwordRetype']
  })

const profileFormSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional()
})

const deleteAccountFormSchema = z
  .object({
    username: z.string().min(6),
    usernameCurrent: z.string().min(6).optional()
  })
  .passthrough()
  .refine((data) => data.username === data.usernameCurrent, {
    message: 'Username is not matching',
    path: ['username']
  })

const changePasswordFormSchema = z
  .object({
    password: z.string().min(8),
    passwordNew: z.string().min(8),
    passwordRetype: z.string().min(8)
  })
  .refine((data) => data.passwordNew !== data.password, {
    message: 'Both new and current passwords are same',
    path: ['passwordNew']
  })
  .refine((data) => data.passwordNew === data.passwordRetype, {
    message: 'Passwords are not matching',
    path: ['passwordRetype']
  })

const forgotPasswordSchema = z.object({
  username: z.string().min(3, 'Please enter your username')
})

const resetPasswordSchema = z
  .object({
    uid: z.string(),
    token: z.string(),
    password: z.string().min(8),
    passwordRetype: z.string().min(8)
  })
  .refine((data) => data.password === data.passwordRetype, {
    message: 'Passwords are not matching',
    path: ['passwordRetype']
  })

export {
  changePasswordFormSchema,
  deleteAccountFormSchema,
  loginFormSchema,
  profileFormSchema,
  registerFormSchema,
  resetPasswordSchema,
  forgotPasswordSchema
}


