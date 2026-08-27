import { 
  users, 
  schemes, 
  applications, 
  documents, 
  applicationStatusHistory, 
  chatMessages,
  type User, 
  type InsertUser, 
  type Scheme, 
  type InsertScheme, 
  type Application, 
  type InsertApplication,
  type Document,
  type InsertDocument,
  type ChatMessage,
  type InsertChatMessage,
  type ApplicationStatusHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  
  getAllSchemes(): Promise<Scheme[]>;
  getScheme(id: string): Promise<Scheme | undefined>;
  createScheme(scheme: InsertScheme): Promise<Scheme>;
  updateScheme(id: string, data: Partial<InsertScheme>): Promise<Scheme | undefined>;
  deleteScheme(id: string): Promise<void>;
  getRecommendedSchemes(userId: string): Promise<Scheme[]>;
  
  getUserApplications(userId: string): Promise<(Application & { scheme: Scheme })[]>;
  getApplication(id: string): Promise<(Application & { scheme: Scheme; statusHistory: ApplicationStatusHistory[] }) | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, data: Partial<InsertApplication>): Promise<Application | undefined>;
  getAllApplications(): Promise<(Application & { scheme: Scheme })[]>;
  
  createDocument(document: InsertDocument): Promise<Document>;
  getApplicationDocuments(applicationId: string): Promise<Document[]>;
  
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getUserChatMessages(userId?: string): Promise<ChatMessage[]>;
  
  createStatusHistory(status: { applicationId: string; status: string; notes?: string }): Promise<ApplicationStatusHistory>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllSchemes(): Promise<Scheme[]> {
    return await db.select().from(schemes).orderBy(desc(schemes.createdAt));
  }

  async getScheme(id: string): Promise<Scheme | undefined> {
    const [scheme] = await db.select().from(schemes).where(eq(schemes.id, id));
    return scheme || undefined;
  }

  async createScheme(insertScheme: InsertScheme): Promise<Scheme> {
    const [scheme] = await db
      .insert(schemes)
      .values(insertScheme)
      .returning();
    return scheme;
  }

  async updateScheme(id: string, data: Partial<InsertScheme>): Promise<Scheme | undefined> {
    const [scheme] = await db
      .update(schemes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schemes.id, id))
      .returning();
    return scheme || undefined;
  }

  async deleteScheme(id: string): Promise<void> {
    await db.delete(schemes).where(eq(schemes.id, id));
  }

  async getRecommendedSchemes(userId: string): Promise<Scheme[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const allSchemes = await this.getAllSchemes();
    
    return allSchemes.filter(scheme => {
      const eligibility = scheme.eligibility;
      
      if (eligibility.states && eligibility.states.length > 0) {
        if (!eligibility.states.includes(user.state)) return false;
      }
      
      if (eligibility.occupations && eligibility.occupations.length > 0) {
        if (!eligibility.occupations.includes(user.occupation)) return false;
      }
      
      if (eligibility.minIncome && user.monthlyIncome * 12 < eligibility.minIncome) {
        return false;
      }
      
      if (eligibility.maxIncome && user.monthlyIncome * 12 > eligibility.maxIncome) {
        return false;
      }
      
      if (eligibility.requiresLand !== undefined && user.hasLand !== eligibility.requiresLand) {
        return false;
      }
      
      if (eligibility.gender && user.gender && eligibility.gender !== user.gender) {
        return false;
      }
      
      return true;
    });
  }

  async getUserApplications(userId: string): Promise<(Application & { scheme: Scheme })[]> {
    const apps = await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.createdAt));

    const appsWithSchemes = await Promise.all(
      apps.map(async (app) => {
        const scheme = await this.getScheme(app.schemeId);
        return { ...app, scheme: scheme! };
      })
    );

    return appsWithSchemes;
  }

  async getApplication(id: string): Promise<(Application & { scheme: Scheme; statusHistory: ApplicationStatusHistory[] }) | undefined> {
    const [app] = await db.select().from(applications).where(eq(applications.id, id));
    if (!app) return undefined;

    const scheme = await this.getScheme(app.schemeId);
    const history = await db
      .select()
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, id))
      .orderBy(desc(applicationStatusHistory.createdAt));

    return { ...app, scheme: scheme!, statusHistory: history };
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [app] = await db
      .insert(applications)
      .values(insertApplication)
      .returning();
    
    await this.createStatusHistory({
      applicationId: app.id,
      status: app.status,
      notes: 'Application created',
    });

    return app;
  }

  async updateApplication(id: string, data: Partial<InsertApplication>): Promise<Application | undefined> {
    const [app] = await db
      .update(applications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();

    if (app && data.status) {
      await this.createStatusHistory({
        applicationId: id,
        status: data.status,
        notes: data.reviewNotes || `Status changed to ${data.status}`,
      });
    }

    return app || undefined;
  }

  async getAllApplications(): Promise<(Application & { scheme: Scheme })[]> {
    const apps = await db
      .select()
      .from(applications)
      .orderBy(desc(applications.createdAt));

    const appsWithSchemes = await Promise.all(
      apps.map(async (app) => {
        const scheme = await this.getScheme(app.schemeId);
        return { ...app, scheme: scheme! };
      })
    );

    return appsWithSchemes;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [doc] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return doc;
  }

  async getApplicationDocuments(applicationId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.applicationId, applicationId));
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [msg] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return msg;
  }

  async getUserChatMessages(userId?: string): Promise<ChatMessage[]> {
    if (userId) {
      return await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.userId, userId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(50);
    } else {
      return await db
        .select()
        .from(chatMessages)
        .orderBy(desc(chatMessages.createdAt))
        .limit(10);
    }
  }

  async createStatusHistory(status: { applicationId: string; status: string; notes?: string }): Promise<ApplicationStatusHistory> {
    const [history] = await db
      .insert(applicationStatusHistory)
      .values(status)
      .returning();
    return history;
  }
}

export const storage = new DatabaseStorage();
