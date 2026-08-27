import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import OpenAI from "openai";
import { loginSchema, insertUserSchema, insertSchemeSchema, insertApplicationSchema, insertChatMessageSchema } from "@shared/schema";
import { validateImage } from "./imageValidation";

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function requireAuth(req: Request, res: Response): Promise<boolean> {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || !user.isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByPhone(data.phone);
      if (existingUser) {
        return res.status(400).json({ error: "Phone number already registered" });
      }
      
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });
      
      res.json({ message: "User created successfully", userId: user.id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      console.log("Login attempt:", { phone: data.phone, passwordLength: data.password.length });
      
      const user = await storage.getUserByPhone(data.phone);
      console.log("User found:", { userId: user?.id, userName: user?.name, isAdmin: user?.isAdmin, hasPassword: !!user?.password });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const isPasswordValid = await bcrypt.compare(data.password, user.password);
      console.log("Password valid:", isPasswordValid);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      req.session.userId = user.id;
      
      const { password, ...userWithoutPassword } = user;
      console.log("Login response user:", { id: userWithoutPassword.id, name: userWithoutPassword.name, isAdmin: userWithoutPassword.isAdmin });
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user/profile", async (req, res) => {
    if (!await requireAuth(req, res)) return;
    
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.patch("/api/user/profile", async (req, res) => {
    if (!await requireAuth(req, res)) return;
    
    try {
      const user = await storage.updateUser(req.session.userId!, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/schemes", async (req, res) => {
    try {
      const schemes = await storage.getAllSchemes();
      res.json(schemes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/schemes/recommended", async (req, res) => {
    if (!await requireAuth(req, res)) return;
    
    try {
      const schemes = await storage.getRecommendedSchemes(req.session.userId!);
      res.json(schemes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/schemes/:id", async (req, res) => {
    try {
      const scheme = await storage.getScheme(req.params.id);
      if (!scheme) {
        return res.status(404).json({ error: "Scheme not found" });
      }
      res.json(scheme);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/applications", async (req, res) => {
    if (!await requireAuth(req, res)) return;
    
    try {
      const applications = await storage.getUserApplications(req.session.userId!);
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/applications/:id", async (req, res) => {
    if (!await requireAuth(req, res)) return;
    
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      res.json(application);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/applications", async (req, res) => {
    if (!await requireAuth(req, res)) return;
    
    try {
      const existingApps = await storage.getUserApplications(req.session.userId!);
      
      // Check if user already has a submitted application for this scheme
      const existingSubmitted = existingApps.find(
        app => app.schemeId === req.body.schemeId && app.status === 'submitted'
      );
      
      if (existingSubmitted) {
        return res.status(409).json({ 
          error: "You have already submitted an application for this scheme. You cannot apply twice for the same scheme.",
          isDuplicate: true,
          existingApplicationId: existingSubmitted.id
        });
      }
      
      // Check if there's already a draft application for this scheme
      if (req.body.status === 'draft' || !req.body.status) {
        const existingDraft = existingApps.find(
          app => app.schemeId === req.body.schemeId && app.status === 'draft'
        );
        
        if (existingDraft) {
          // Return the existing draft instead of creating a new one
          return res.json(existingDraft);
        }
      }
      
      // Prevent submitting if trying to submit when already submitted
      if (req.body.status === 'submitted') {
        const existingAny = existingApps.find(
          app => app.schemeId === req.body.schemeId && 
                  (app.status === 'submitted' || app.status === 'reviewed' || app.status === 'approved' || app.status === 'rejected')
        );
        
        if (existingAny) {
          return res.status(409).json({ 
            error: "You have already applied for this scheme. You cannot apply twice for the same scheme.",
            isDuplicate: true,
            existingApplicationId: existingAny.id
          });
        }
      }
      
      const application = await storage.createApplication({
        userId: req.session.userId!,
        schemeId: req.body.schemeId,
        status: req.body.status || 'draft',
        currentStep: req.body.currentStep || 1,
        totalSteps: req.body.totalSteps || 5,
        formData: req.body.formData || {},
      });
      
      if (req.body.status === 'submitted') {
        await storage.updateApplication(application.id, {
          submittedAt: new Date(),
        });
      }
      
      res.json(application);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/applications/:id", async (req, res) => {
    if (!await requireAuth(req, res)) return;
    
    try {
      const updateData: any = {
        formData: req.body.formData,
        currentStep: req.body.currentStep,
      };

      if (req.body.status) {
        updateData.status = req.body.status;
        if (req.body.status === 'submitted') {
          updateData.submittedAt = new Date();
        }
      }

      const application = await storage.updateApplication(req.params.id, updateData);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      res.json(application);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/verify-document", async (req, res) => {
    if (!await requireAuth(req, res)) return;
    
    try {
      const { documentImage, documentType } = req.body;
      
      if (!documentImage || !documentType) {
        return res.status(400).json({ error: "Missing document image or type" });
      }

      // Convert data URL to base64 if needed
      let base64Image = documentImage;
      let imageBuffer: Buffer | null = null;
      
      if (documentImage.startsWith('data:')) {
        base64Image = documentImage.split(',')[1];
        imageBuffer = Buffer.from(base64Image, 'base64');
      } else {
        imageBuffer = Buffer.from(documentImage, 'base64');
      }

      // Step 1: Run deep learning image validation in parallel with API verification
      const imageQualityPromise = validateImage(imageBuffer);
      
      const verificationPrompt = documentType === 'aadhar'
        ? `Simple check for Aadhar document:
1. Look for a 12-digit number (the Aadhar number, format: XXXX XXXX XXXX or XXXXXXXXXXXX)
2. If you find a 12-digit number, it is a valid Aadhar document
3. If no 12-digit number found, it is unknown/invalid

Return JSON:
{
  "documentType": "aadhar" if 12-digit number found, "unknown" if NOT found,
  "has12DigitNumber": true if found, false if not,
  "aadhaarNumber": "the 12-digit number if found",
  "confidence": 100 if found, 0 if not
}`
        : `Simple check for PAN document:
1. Look for a 10-character PAN code (format: 5 letters + 4 numbers + 1 letter, e.g., AAAAA0000A)
2. If you find a 10-character code in this format, it is a valid PAN document
3. If no 10-character code found, it is unknown/invalid

Return JSON:
{
  "documentType": "pan" if 10-char code found, "unknown" if NOT found,
  "has10CharCode": true if found, false if not,
  "panCode": "the 10-character code if found",
  "confidence": 100 if found, 0 if not
}`;

      let apiVerificationResult: any = null;
      let apiError: any = null;
      
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-5",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: verificationPrompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
        });

        apiVerificationResult = JSON.parse(response.choices[0].message.content || '{}');
      } catch (error: any) {
        apiError = error;
        apiVerificationResult = {
          isValid: null,
          confidence: 0,
          issues: ['Unable to verify document with AI'],
          extractedInfo: {}
        };
      }

      // Get image quality results
      const imageQuality = await imageQualityPromise;

      // Check if uploaded document type matches expected type
      const detectedType = apiVerificationResult?.documentType || 'unknown';
      // Accept document if: (1) GPT explicitly says it's correct, OR (2) detected type matches expected type
      const isCorrectDocumentType = apiVerificationResult?.isCorrectDocument === true || 
                                     detectedType === documentType;
      
      // Log for debugging
      console.log('Document verification:', {
        documentType,
        detectedType,
        hasAadhaarNumber: apiVerificationResult?.has12DigitNumber,
        hasAadhaarText: apiVerificationResult?.hasAadhaarText,
        hasPANCode: apiVerificationResult?.has10CharCode,
        hasPANText: apiVerificationResult?.hasPANText,
        looksOfficial: apiVerificationResult?.looksOfficial,
        isCorrectDocumentType
      });
      
      // If wrong document type was uploaded, add to issues
      const issues = [...(apiVerificationResult?.issues || []), ...imageQuality.issues];
      if (!isCorrectDocumentType && detectedType && detectedType !== 'unknown') {
        if (documentType === 'aadhar' && detectedType !== 'aadhar') {
          issues.push(`Wrong document type detected: You uploaded ${detectedType}, but Aadhar is required`);
        } else if (documentType === 'pan' && detectedType !== 'pan') {
          issues.push(`Wrong document type detected: You uploaded ${detectedType}, but PAN is required`);
        }
      }

      // Combine results
      const combinedVerification = {
        documentType: detectedType,
        isCorrectDocumentType: isCorrectDocumentType,
        isValid: (apiVerificationResult?.isValid || false) && imageQuality.isValid && isCorrectDocumentType,
        confidence: Math.round((((apiVerificationResult?.confidence || 0) + imageQuality.confidence) / 2) * 0.95),
        issues: issues,
        extractedInfo: apiVerificationResult?.extractedInfo || {},
        imageQuality: {
          overallScore: imageQuality.overallScore,
          algorithms: {
            blurDetection: imageQuality.algorithms.blurDetection,
            brightnessAnalysis: imageQuality.algorithms.brightnessAnalysis,
            contrastAnalysis: imageQuality.algorithms.contrastAnalysis,
            edgeDetection: imageQuality.algorithms.edgeDetection,
            dimensionalAnalysis: imageQuality.algorithms.dimensionalAnalysis,
            colorAnalysis: imageQuality.algorithms.colorAnalysis,
            noiseAnalysis: imageQuality.algorithms.noiseAnalysis,
          }
        },
        recommendations: [
          ...imageQuality.recommendations,
          ...(isCorrectDocumentType ? [] : ['Please upload the correct document type'])
        ]
      };
      
      res.json({
        documentType,
        verification: combinedVerification,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user context for smarter responses
  const getUserContext = async (userId: string) => {
    try {
      const user = await storage.getUser(userId);
      const applications = await storage.getUserApplications(userId);
      const allSchemes = await storage.getAllSchemes();
      
      return { user, applications, allSchemes };
    } catch (error) {
      return { user: null, applications: [], allSchemes: [] };
    }
  };

  // Intelligent fallback responses for when API quota is exceeded
  const getSmartFallback = (message: string, language: string): string => {
    const lowerMsg = message.toLowerCase();
    
    // Kannada responses
    if (language === 'kn') {
      if (lowerMsg.includes('ಯೋಜನೆ') || lowerMsg.includes('scheme')) {
        return 'ನಿಮ್ಮ ಮೇಲೆ ಅನ್ವಯವಾಗುವ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಆಪಣ ಪೋರ್ಟಲ್ನಲ್ಲಿ "ಯೋಜನೆಗಳು" ವಿಭಾಗವನ್ನು ದರ್ಶಿಸಿ. ಅಲ್ಲಿ ನೀವು ಅರ್ಹತೆ ಮತ್ತು ಪ್ರತಿಟು ಯೋಜನೆಯ ವಿವರಣೆಯನ್ನು ಕಾಣಬಹುದು.';
      }
      if (lowerMsg.includes('ಅರ್ಜಿ') || lowerMsg.includes('apply')) {
        return 'ಅರ್ಜಿ ಸಲ್ಲಿಸಲು: (1) ಯೋಜನೆ ಆಯ್ಕೆ ಮಾಡಿ (2) ಅರ್ಜಿ ಸಿ ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ (3) ಎಲ್ಲ ವಿವರಣೆ ತುಂಬಿ ಆವಶ್ಯಕ ದಾಖಲೆ ಅಪ್ಲೋಡ್ ಮಾಡಿ. ನಾವು ನಿಮ್ಮ ಆವೇದನವನ್ನು ಪರಿಶೀಲಿಸುತ್ತೇವೆ.';
      }
      if (lowerMsg.includes('ದಾಖಲೆ') || lowerMsg.includes('document')) {
        return 'ಸಾಮಾನ್ಯ ದಾಖಲೆಗಳು: ಆಧಾರ, ಪ್ಯಾನ್, ಭೂದಾಸ, ಬ್ಯಾಂಕ್ ವಿವರಣೆ. ಪ್ರತಿಟು ಯೋಜನೆಯ ವಿವರಣೆಯಲ್ಲಿ ಕೃತ್ಯವಾಗಿ ದಾಖಲೆ ಪಟ್ಟಿ ಇದೆ.';
      }
      if (lowerMsg.includes('ಅರ್ಹತೆ') || lowerMsg.includes('eligibility')) {
        return 'ಅರ್ಹತೆ ಪರಿಶೀಲನೆ ನಿಮ್ಮ ಆದಾಯ, ಶಿಕ್ಷೆ, ಭೂಸ್ವಾಮ್ಯ ಮತ್ತು ವೃತ್ತಿ ಮೇಲೆ ಆಧಾರಿತವಾಗಿದೆ. ಪ್ರತಿಟು ಯೋಜನೆಯ ಪೂರ್ಣ ಅರ್ಹತೆ ಮಾನದಂಡ ಅದರ ವಿವರಣೆಯಲ್ಲಿ ವಿವರಿಸಲಾಗಿದೆ.';
      }
      return 'ಸರ್ಕಾರಿ ಯೋಜನೆ ಪೋರ್ಟಲ್‌ನೀ ಸ್ವಾಗತ! ಯೋಜನೆಗಳು, ಅರ್ಹತೆ, ಅರ್ಜಿ ಪ್ರಕ್ರಿಯೆ ಬಗ್ಗೆ ಕೇಳಿ.';
    }
    
    // Hindi responses
    if (language === 'hi') {
      if (lowerMsg.includes('योजना') || lowerMsg.includes('scheme')) {
        return 'अपने लिए उपलब्ध योजनाएं देखने के लिए "योजनाएं" सेक्शन खोलें। वहां आपको हर योजना की पूरी जानकारी, पात्रता और लाभ मिलेंगे।';
      }
      if (lowerMsg.includes('आवेदन') || lowerMsg.includes('apply')) {
        return 'आवेदन करने के लिए: (1) योजना चुनें (2) "आवेदन करें" बटन दबाएं (3) सभी विवरण भरें और दस्तावेज अपलोड करें। हम आपके आवेदन की समीक्षा करेंगे।';
      }
      if (lowerMsg.includes('दस्तावेज') || lowerMsg.includes('document')) {
        return 'आमतौर पर आवश्यक दस्तावेज: आधार, पैन, जमीन के कागजात, बैंक खाता विवरण। प्रत्येक योजना के लिए सटीक दस्तावेज सूची उसके विवरण में दी गई है।';
      }
      if (lowerMsg.includes('योग्यता') || lowerMsg.includes('eligibility')) {
        return 'पात्रता आपकी आय, शिक्षा, भूमि और व्यवसाय पर निर्भर करती है। हर योजना की सभी पात्रता शर्तें उसके विवरण पृष्ठ पर स्पष्ट रूप से दी गई हैं।';
      }
      return 'सरकारी योजना पोर्टल में आपका स्वागत है! योजनाओं, पात्रता, आवेदन प्रक्रिया के बारे में पूछें।';
    }
    
    // English responses
    if (lowerMsg.includes('scheme')) {
      return 'Check the "Schemes" section to see all government schemes available for you. Each scheme shows eligibility requirements, benefits, required documents, and application deadlines.';
    }
    if (lowerMsg.includes('application') || lowerMsg.includes('apply')) {
      return 'To apply for a scheme: (1) Select the scheme (2) Click "Apply Now" button (3) Fill all details and upload required documents. Your application will be reviewed by our team.';
    }
    if (lowerMsg.includes('document')) {
      return 'Commonly required documents include: Aadhaar, PAN, land documents, and bank account details. The exact documents needed for each scheme are listed in its details page.';
    }
    if (lowerMsg.includes('eligibility') || lowerMsg.includes('eligible')) {
      return 'Eligibility depends on your income, education, land ownership, and occupation. All eligibility criteria for each scheme are clearly listed on its details page.';
    }
    if (lowerMsg.includes('status')) {
      return 'You can check your application status in the "My Applications" section. Your status updates automatically as it moves through review stages.';
    }
    return 'Welcome to the Government Schemes Portal! Ask about available schemes, eligibility requirements, how to apply, or required documents.';
  };

  app.post("/api/chat/send", async (req, res) => {
    let language = 'en'; // Default language
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { message } = req.body;
      language = req.body.language || 'en';
      
      try {
        // Get user context for better responses
        const { user, applications, allSchemes } = await getUserContext(req.session.userId);
        
        // Build context string about user's applications
        const applicationsContext = applications.length > 0 
          ? `User has already applied to: ${applications.map(a => a.schemeId).join(', ')}`
          : 'User has not applied to any schemes yet';
        
        // Build schemes list for context
        const schemesList = allSchemes.slice(0, 5).map(s => `- ${s.name} (${s.category})`).join('\n');

        // Create comprehensive system prompt
        const systemPrompt = language === 'kn' 
          ? `ನೀವು ಭಾರತದಲ್ಲಿ ಗ್ರಾಮೀಣ ಉದ್ಯಮಿಗಳು ಮತ್ತು ರೈತರಿಗೆ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಸಹಾಯ ಮಾಡುವ ಸಹಾಯಕರು. ಸರಳ, ಸಾಧಾರಣ ಭಾಷೆಯಲ್ಲಿ ಉತ್ತರಿಸಿ. ಪ್ರತಿಟು ಪ್ರಶ್ನೆಯ ಉತ್ತರ ಸ್ಪಷ್ಟ ಮತ್ತು ಪೂರ್ತಿವಾಗಿ ಮಾಡಿ.`
          : language === 'hi'
          ? `आप भारत में ग्रामीण उद्यमियों और किसानों को सरकारी योजनाओं के बारे में विस्तृत सहायता प्रदान करते हैं। सरल, आम भाषा में विस्तार से उत्तर दें।`
          : `You are a comprehensive government schemes assistant. Answer in simple, everyday language. Provide detailed, complete answers to every question.`;

        const response = await openai.chat.completions.create({
          model: "gpt-5",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        const assistantMessage = response.choices[0].message.content || 'I apologize, but I could not generate a response.';
        
        const chatMessage = await storage.createChatMessage({
          userId: req.session.userId,
          message,
          response: assistantMessage,
          language,
        });
        
        return res.json(chatMessage);
      } catch (apiError: any) {
        // If API quota exceeded, use fallback responses
        if (apiError.code === 'insufficient_quota' || (apiError.message && apiError.message.includes('quota'))) {
          console.log("API quota exceeded, using fallback response");
          const fallbackResponse = getSmartFallback(message, language);
          
          const chatMessage = await storage.createChatMessage({
            userId: req.session.userId,
            message,
            response: fallbackResponse,
            language,
          });
          
          return res.json(chatMessage);
        }
        
        throw apiError;
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      
      res.status(500).json({ 
        error: error.message || 'Failed to process message' 
      });
    }
  });

  app.get("/api/chat/messages", async (req, res) => {
    try {
      const messages = await storage.getUserChatMessages(req.session.userId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/applications", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    
    try {
      const applications = await storage.getAllApplications();
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/applications/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    
    try {
      const updateData: any = {};
      
      if (req.body.status) {
        updateData.status = req.body.status;
        if (req.body.status === 'approved' || req.body.status === 'rejected') {
          updateData.reviewedAt = new Date();
        }
      }
      
      if (req.body.reviewNotes) {
        updateData.reviewNotes = req.body.reviewNotes;
      }
      
      const application = await storage.updateApplication(req.params.id, updateData);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      res.json(application);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/admin/schemes", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    
    try {
      const data = insertSchemeSchema.parse(req.body);
      const scheme = await storage.createScheme(data);
      res.json(scheme);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/admin/schemes/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    
    try {
      const scheme = await storage.updateScheme(req.params.id, req.body);
      if (!scheme) {
        return res.status(404).json({ error: "Scheme not found" });
      }
      res.json(scheme);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/schemes/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    
    try {
      await storage.deleteScheme(req.params.id);
      res.json({ message: "Scheme deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
