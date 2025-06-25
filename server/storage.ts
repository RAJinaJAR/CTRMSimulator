import { 
  users, 
  testSessions, 
  testAttempts, 
  testResults,
  type User, 
  type InsertUser,
  type TestSession,
  type InsertTestSession,
  type TestAttempt,
  type InsertTestAttempt,
  type TestResult,
  type InsertTestResult,
  type HotspotData
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createTestSession(session: InsertTestSession): Promise<TestSession>;
  getTestSession(id: number): Promise<TestSession | undefined>;
  updateTestSession(id: number, updates: Partial<TestSession>): Promise<TestSession | undefined>;
  
  createTestAttempt(attempt: InsertTestAttempt): Promise<TestAttempt>;
  getTestAttemptsBySession(sessionId: number): Promise<TestAttempt[]>;
  
  createTestResult(result: InsertTestResult): Promise<TestResult>;
  getTestResult(sessionId: number): Promise<TestResult | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private testSessions: Map<number, TestSession>;
  private testAttempts: Map<number, TestAttempt>;
  private testResults: Map<number, TestResult>;
  private currentUserId: number;
  private currentSessionId: number;
  private currentAttemptId: number;
  private currentResultId: number;

  constructor() {
    this.users = new Map();
    this.testSessions = new Map();
    this.testAttempts = new Map();
    this.testResults = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentAttemptId = 1;
    this.currentResultId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createTestSession(insertSession: InsertTestSession): Promise<TestSession> {
    const id = this.currentSessionId++;
    const session: TestSession = {
      ...insertSession,
      id,
      userId: insertSession.userId || null,
      currentStep: 1,
      isCompleted: false,
      startTime: new Date(),
      completedTime: null,
    };
    this.testSessions.set(id, session);
    return session;
  }

  async getTestSession(id: number): Promise<TestSession | undefined> {
    return this.testSessions.get(id);
  }

  async updateTestSession(id: number, updates: Partial<TestSession>): Promise<TestSession | undefined> {
    const session = this.testSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.testSessions.set(id, updatedSession);
    return updatedSession;
  }

  async createTestAttempt(insertAttempt: InsertTestAttempt): Promise<TestAttempt> {
    const id = this.currentAttemptId++;
    const attempt: TestAttempt = {
      ...insertAttempt,
      id,
      attemptTime: new Date(),
    };
    this.testAttempts.set(id, attempt);
    return attempt;
  }

  async getTestAttemptsBySession(sessionId: number): Promise<TestAttempt[]> {
    return Array.from(this.testAttempts.values()).filter(
      (attempt) => attempt.sessionId === sessionId
    );
  }

  async createTestResult(insertResult: InsertTestResult): Promise<TestResult> {
    const id = this.currentResultId++;
    const result: TestResult = {
      ...insertResult,
      id,
      completedAt: new Date(),
    };
    this.testResults.set(id, result);
    return result;
  }

  async getTestResult(sessionId: number): Promise<TestResult | undefined> {
    return Array.from(this.testResults.values()).find(
      (result) => result.sessionId === sessionId
    );
  }
}

export const storage = new MemStorage();
