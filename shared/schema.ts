import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  state: text("state").notNull(),
  district: text("district").notNull(),
  occupation: text("occupation").notNull(),
  monthlyIncome: integer("monthly_income").notNull(),
  hasLand: boolean("has_land").notNull().default(false),
  landArea: integer("land_area"),
  gender: text("gender"),
  dateOfBirth: text("date_of_birth"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  applications: many(applications),
  chatMessages: many(chatMessages),
}));

export const schemes = pgTable("schemes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameKannada: text("name_kannada"),
  nameHindi: text("name_hindi"),
  description: text("description").notNull(),
  descriptionKannada: text("description_kannada"),
  descriptionHindi: text("description_hindi"),
  category: text("category").notNull(),
  eligibility: jsonb("eligibility").notNull().$type<{
    states?: string[];
    minIncome?: number;
    maxIncome?: number;
    occupations?: string[];
    requiresLand?: boolean;
    minAge?: number;
    maxAge?: number;
    gender?: string;
  }>(),
  benefits: jsonb("benefits").notNull().$type<Array<{ titleEn: string; titleKn?: string; titleHi?: string; description: string }>>(),
  requiredDocuments: jsonb("required_documents").notNull().$type<string[]>(),
  applicationDeadline: text("application_deadline"),
  howToApply: text("how_to_apply").notNull(),
  howToApplyKannada: text("how_to_apply_kannada"),
  howToApplyHindi: text("how_to_apply_hindi"),
  officialUrl: text("official_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const schemesRelations = relations(schemes, ({ many }) => ({
  applications: many(applications),
}));

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  schemeId: varchar("scheme_id").notNull().references(() => schemes.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("draft"),
  currentStep: integer("current_step").notNull().default(1),
  totalSteps: integer("total_steps").notNull().default(5),
  formData: jsonb("form_data").notNull().$type<Record<string, any>>().default({}),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  scheme: one(schemes, {
    fields: [applications.schemeId],
    references: [schemes.id],
  }),
  documents: many(documents),
  statusHistory: many(applicationStatusHistory),
}));

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(),
  fileName: text("file_name").notNull(),
  fileData: text("file_data").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const documentsRelations = relations(documents, ({ one }) => ({
  application: one(applications, {
    fields: [documents.applicationId],
    references: [applications.id],
  }),
}));

export const applicationStatusHistory = pgTable("application_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const applicationStatusHistoryRelations = relations(applicationStatusHistory, ({ one }) => ({
  application: one(applications, {
    fields: [applicationStatusHistory.applicationId],
    references: [applications.id],
  }),
}));

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  response: text("response").notNull(),
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
  email: z.string().email().optional().or(z.literal("")),
});

export const loginSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
  password: z.string().min(1, "Password is required"),
});

export const insertSchemeSchema = createInsertSchema(schemes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
  reviewedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Scheme = typeof schemes.$inferSelect;
export type InsertScheme = z.infer<typeof insertSchemeSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ApplicationStatusHistory = typeof applicationStatusHistory.$inferSelect;
