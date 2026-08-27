/**
 * Zod validation schemas for patient forms.
 */

import { z } from "zod";

export const patientFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  sex: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Please select a gender" }),
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;
