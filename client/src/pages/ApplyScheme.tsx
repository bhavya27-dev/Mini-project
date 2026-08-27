import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation, useSearch } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { CheckCircle2, Upload, ArrowLeft, ArrowRight, Save, AlertCircle, Loader } from 'lucide-react';
import type { Scheme, Application } from '@shared/schema';

export default function ApplyScheme() {
  const { t } = useLanguage();
  const { id } = useParams();
  const search = useSearch();
  const urlApplicationId = new URLSearchParams(search).get('applicationId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [documentVerification, setDocumentVerification] = useState<Record<string, any>>({});
  const [verifyingDocument, setVerifyingDocument] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(urlApplicationId);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const draftIdRef = useRef<string | null>(urlApplicationId || null);
  const totalSteps = 5;

  const { data: scheme } = useQuery<Scheme>({
    queryKey: ['/api/schemes', id],
  });

  const { data: existingApplication } = useQuery<Application>({
    queryKey: ['/api/applications', applicationId],
    enabled: !!applicationId,
  });

  // Check if user already has a submitted application for this scheme
  const { data: userApplications } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
  });

  useEffect(() => {
    if (urlApplicationId && urlApplicationId !== applicationId) {
      setApplicationId(urlApplicationId);
    }
  }, [urlApplicationId, applicationId]);

  useEffect(() => {
    if (existingApplication) {
      setFormData(existingApplication.formData || {});
      setCurrentStep(existingApplication.currentStep);
    }
  }, [existingApplication]);

  // Check if user already has a submitted application for this scheme
  useEffect(() => {
    if (userApplications && id) {
      const hasSubmitted = userApplications.some(
        app => app.schemeId === id && (app.status === 'submitted' || app.status === 'reviewed' || app.status === 'approved' || app.status === 'rejected')
      );
      setAlreadyApplied(hasSubmitted);
    }
  }, [userApplications, id]);

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      // Use ref to get the latest applicationId (avoids race conditions)
      if (draftIdRef.current) {
        const response = await apiRequest('PATCH', `/api/applications/${draftIdRef.current}`, {
          formData,
          currentStep,
        });
        return await response.json();
      } else {
        const response = await apiRequest('POST', '/api/applications', {
          schemeId: id,
          status: 'draft',
          currentStep,
          totalSteps,
          formData,
        });
        return await response.json();
      }
    },
    onSuccess: (data) => {
      toast({
        title: 'Draft Saved',
        description: 'Your application has been saved as draft.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      // Update the ref immediately to avoid race conditions
      if (data.id) {
        draftIdRef.current = data.id;
        if (!applicationId) {
          setApplicationId(data.id);
          window.history.replaceState({}, '', `/apply/${id}?applicationId=${data.id}`);
        }
      }
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (applicationId) {
        const response = await apiRequest('PATCH', `/api/applications/${applicationId}`, {
          formData,
          currentStep: totalSteps,
          status: 'submitted',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to submit application');
        }
        return await response.json();
      } else {
        const response = await apiRequest('POST', '/api/applications', {
          schemeId: id,
          status: 'submitted',
          currentStep: totalSteps,
          totalSteps,
          formData,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to submit application');
        }
        return await response.json();
      }
    },
    onSuccess: (data) => {
      toast({
        title: 'Application Submitted',
        description: 'Your application has been submitted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications', data.id] });
      // Give the backend time to create status history before redirecting
      setTimeout(() => {
        setLocation(`/application/${data.id}`);
      }, 500);
    },
    onError: (error: any) => {
      if (error.message.includes('already') || error.message.includes('twice') || error.message.includes('duplicate')) {
        toast({
          variant: 'destructive',
          title: 'Cannot Apply Again',
          description: 'You have already submitted an application for this scheme. You can only apply once per scheme.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Submission Failed',
          description: error.message || 'Failed to submit application',
        });
      }
    },
  });

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      saveDraftMutation.mutate();
    } else {
      submitMutation.mutate();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileUpload = async (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        handleInputChange(field, reader.result);
        
        // Verify document using AI
        const documentType = field === 'aadharDocument' ? 'aadhar' : field === 'panDocument' ? 'pan' : null;
        if (documentType && reader.result) {
          setVerifyingDocument(documentType);
          try {
            const response = await apiRequest('POST', '/api/verify-document', {
              documentImage: reader.result,
              documentType,
            });
            if (!response.ok) {
              throw new Error('Document verification failed');
            }
            const result = await response.json();
            setDocumentVerification(prev => ({
              ...prev,
              [documentType]: result
            }));
            
            const verification = result.verification;
            const isCorrectType = verification?.isCorrectDocumentType;
            const isValid = verification?.isValid;
            
            // Check document type first
            if (!isCorrectType) {
              toast({
                variant: 'destructive',
                title: 'Wrong Document Type',
                description: `You uploaded a ${verification?.documentType || 'unknown'} document, but ${documentType.toUpperCase()} is required. Please upload the correct document.`,
              });
            } else if (!isValid) {
              toast({
                variant: 'destructive',
                title: 'Document Issues Detected',
                description: `Issues found: ${verification?.issues?.slice(0, 2)?.join(', ') || 'Document quality issues'}. Confidence: ${verification?.confidence || 0}%`,
              });
            } else {
              toast({
                title: 'Document Verified Successfully',
                description: `${documentType.toUpperCase()} verified as correct document type with ${verification?.confidence || 0}% confidence.`,
              });
            }
          } catch (error: any) {
            console.error('Document verification error:', error);
            toast({
              variant: 'destructive',
              title: 'Verification Failed',
              description: 'Could not verify document. Please try uploading again.',
            });
          } finally {
            setVerifyingDocument(null);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!scheme) {
    return <div className="p-6 text-center text-xl">Loading...</div>;
  }

  const progress = (currentStep / totalSteps) * 100;

  // If already applied for this scheme, show message
  if (alreadyApplied && !applicationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{scheme?.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">Already Applied</h3>
                    <p className="text-red-800 dark:text-red-200 text-base">
                      You have already submitted an application for this scheme. You can only apply once per scheme.
                    </p>
                    <p className="text-red-700 dark:text-red-300 text-sm mt-3">
                      To view your application status, please go to your dashboard and check "My Applications".
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setLocation('/dashboard')}
                size="lg"
                data-testid="button-go-to-dashboard"
              >
                Go to My Applications
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="applicantName" className="text-base">Full Name</Label>
              <Input
                id="applicantName"
                value={formData.applicantName || ''}
                onChange={(e) => handleInputChange('applicantName', e.target.value)}
                className="text-lg h-12 mt-2"
                data-testid="input-applicant-name"
              />
            </div>
            <div>
              <Label htmlFor="fatherName" className="text-base">Father's/Guardian's Name</Label>
              <Input
                id="fatherName"
                value={formData.fatherName || ''}
                onChange={(e) => handleInputChange('fatherName', e.target.value)}
                className="text-lg h-12 mt-2"
                data-testid="input-father-name"
              />
            </div>
            <div>
              <Label htmlFor="address" className="text-base">Residential Address</Label>
              <Textarea
                id="address"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="text-lg mt-2"
                rows={4}
                data-testid="input-address"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="occupation" className="text-base">Occupation Details</Label>
              <Textarea
                id="occupation"
                value={formData.occupationDetails || ''}
                onChange={(e) => handleInputChange('occupationDetails', e.target.value)}
                className="text-lg mt-2"
                rows={4}
                data-testid="input-occupation-details"
              />
            </div>
            <div>
              <Label htmlFor="annualIncome" className="text-base">Annual Income (₹)</Label>
              <Input
                id="annualIncome"
                type="number"
                value={formData.annualIncome || ''}
                onChange={(e) => handleInputChange('annualIncome', Number(e.target.value))}
                className="text-lg h-12 mt-2"
                data-testid="input-annual-income"
              />
            </div>
            <div>
              <Label htmlFor="bankAccount" className="text-base">Bank Account Number</Label>
              <Input
                id="bankAccount"
                value={formData.bankAccount || ''}
                onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                className="text-lg h-12 mt-2"
                data-testid="input-bank-account"
              />
            </div>
            <div>
              <Label htmlFor="ifscCode" className="text-base">IFSC Code</Label>
              <Input
                id="ifscCode"
                value={formData.ifscCode || ''}
                onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                className="text-lg h-12 mt-2"
                data-testid="input-ifsc-code"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="aadharUpload" className="text-base">Upload Aadhar Card</Label>
              <div className="mt-2">
                <Input
                  id="aadharUpload"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('aadharDocument', e)}
                  className="text-base"
                  disabled={verifyingDocument === 'aadhar'}
                  data-testid="input-aadhar-upload"
                />
                {verifyingDocument === 'aadhar' && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Loader className="h-5 w-5 animate-spin" />
                      <span className="font-medium">Analyzing image quality & verifying document...</span>
                    </div>
                    <p className="text-sm text-blue-600">Using deep learning to check image clarity, brightness, contrast, and document authenticity</p>
                  </div>
                )}
                {formData.aadharDocument && verifyingDocument !== 'aadhar' && documentVerification.aadhar && (
                  <div className="mt-4 space-y-3">
                    <div className={`p-4 rounded-lg ${documentVerification.aadhar.verification.isValid ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {documentVerification.aadhar.verification.isValid ? (
                          <>
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            <span className="font-semibold text-green-900 dark:text-green-100">Document Verified</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-6 w-6 text-yellow-600" />
                            <span className="font-semibold text-yellow-900 dark:text-yellow-100">Verification Issues Found</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm mb-2">Overall Quality Score: <span className="font-bold">{documentVerification.aadhar.verification.imageQuality?.overallScore || 0}/100</span></p>
                      <p className="text-sm">Confidence Level: <span className="font-bold">{documentVerification.aadhar.verification.confidence}%</span></p>
                    </div>
                    
                    {documentVerification.aadhar.verification.imageQuality && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                        <p className="font-semibold text-sm mb-3">Image Quality Analysis (Deep Learning):</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {documentVerification.aadhar.verification.imageQuality.algorithms && (
                            <>
                              <div className="flex items-center justify-between">
                                <span>✓ Sharpness:</span>
                                <span className={documentVerification.aadhar.verification.imageQuality.algorithms.blurDetection.isBlurry ? 'text-red-600' : 'text-green-600'}>{documentVerification.aadhar.verification.imageQuality.algorithms.blurDetection.score}/100</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>✓ Brightness:</span>
                                <span className={documentVerification.aadhar.verification.imageQuality.algorithms.brightnessAnalysis.isOptimal ? 'text-green-600' : 'text-yellow-600'}>{documentVerification.aadhar.verification.imageQuality.algorithms.brightnessAnalysis.score}/100</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>✓ Contrast:</span>
                                <span className={documentVerification.aadhar.verification.imageQuality.algorithms.contrastAnalysis.isOptimal ? 'text-green-600' : 'text-yellow-600'}>{documentVerification.aadhar.verification.imageQuality.algorithms.contrastAnalysis.score}/100</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>✓ Document Edges:</span>
                                <span className={documentVerification.aadhar.verification.imageQuality.algorithms.edgeDetection.hasDocument ? 'text-green-600' : 'text-red-600'}>{documentVerification.aadhar.verification.imageQuality.algorithms.edgeDetection.score}/100</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>✓ Resolution:</span>
                                <span className={documentVerification.aadhar.verification.imageQuality.algorithms.dimensionalAnalysis.isValid ? 'text-green-600' : 'text-red-600'}>{documentVerification.aadhar.verification.imageQuality.algorithms.dimensionalAnalysis.score}/100</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>✓ Color Quality:</span>
                                <span className="text-green-600">{documentVerification.aadhar.verification.imageQuality.algorithms.colorAnalysis.score}/100</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {documentVerification.aadhar.verification.issues && documentVerification.aadhar.verification.issues.length > 0 && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="font-semibold text-sm text-red-900 dark:text-red-100 mb-2">Issues Found:</p>
                        <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                          {documentVerification.aadhar.verification.issues.map((issue: string, idx: number) => (
                            <li key={idx}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {documentVerification.aadhar.verification.recommendations && documentVerification.aadhar.verification.recommendations.length > 0 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">Recommendations:</p>
                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                          {documentVerification.aadhar.verification.recommendations.map((rec: string, idx: number) => (
                            <li key={idx}>💡 {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="panUpload" className="text-base">Upload PAN Card</Label>
              <div className="mt-2">
                <Input
                  id="panUpload"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('panDocument', e)}
                  className="text-base"
                  disabled={verifyingDocument === 'pan'}
                  data-testid="input-pan-upload"
                />
                {verifyingDocument === 'pan' && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Loader className="h-5 w-5 animate-spin" />
                      <span className="font-medium">Analyzing image quality & verifying document...</span>
                    </div>
                    <p className="text-sm text-blue-600">Using deep learning to check image clarity, brightness, contrast, and document authenticity</p>
                  </div>
                )}
                {formData.panDocument && verifyingDocument !== 'pan' && documentVerification.pan && (
                  <div className="mt-4 space-y-3">
                    <div className={`p-4 rounded-lg ${documentVerification.pan.verification.isValid ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {documentVerification.pan.verification.isValid ? (
                          <>
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            <span className="font-semibold text-green-900 dark:text-green-100">Document Verified</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-6 w-6 text-yellow-600" />
                            <span className="font-semibold text-yellow-900 dark:text-yellow-100">Verification Issues Found</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm mb-2">Overall Quality Score: <span className="font-bold">{documentVerification.pan.verification.imageQuality?.overallScore || 0}/100</span></p>
                      <p className="text-sm">Confidence Level: <span className="font-bold">{documentVerification.pan.verification.confidence}%</span></p>
                    </div>
                    
                    {documentVerification.pan.verification.imageQuality && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                        <p className="font-semibold text-sm mb-3">Image Quality Analysis (Deep Learning):</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {documentVerification.pan.verification.imageQuality.algorithms && (
                            <>
                              <div className="flex items-center justify-between">
                                <span>✓ Sharpness:</span>
                                <span className={documentVerification.pan.verification.imageQuality.algorithms.blurDetection.isBlurry ? 'text-red-600' : 'text-green-600'}>{documentVerification.pan.verification.imageQuality.algorithms.blurDetection.score}/100</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>✓ Brightness:</span>
                                <span className={documentVerification.pan.verification.imageQuality.algorithms.brightnessAnalysis.isOptimal ? 'text-green-600' : 'text-yellow-600'}>{documentVerification.pan.verification.imageQuality.algorithms.brightnessAnalysis.score}/100</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>✓ Contrast:</span>
                                <span className={documentVerification.pan.verification.imageQuality.algorithms.contrastAnalysis.isOptimal ? 'text-green-600' : 'text-yellow-600'}>{documentVerification.pan.verification.imageQuality.algorithms.contrastAnalysis.score}/100</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>✓ Document Edges:</span>
                                <span className={documentVerification.pan.verification.imageQuality.algorithms.edgeDetection.hasDocument ? 'text-green-600' : 'text-red-600'}>{documentVerification.pan.verification.imageQuality.algorithms.edgeDetection.score}/100</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>✓ Resolution:</span>
                                <span className={documentVerification.pan.verification.imageQuality.algorithms.dimensionalAnalysis.isValid ? 'text-green-600' : 'text-red-600'}>{documentVerification.pan.verification.imageQuality.algorithms.dimensionalAnalysis.score}/100</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>✓ Color Quality:</span>
                                <span className="text-green-600">{documentVerification.pan.verification.imageQuality.algorithms.colorAnalysis.score}/100</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {documentVerification.pan.verification.issues && documentVerification.pan.verification.issues.length > 0 && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="font-semibold text-sm text-red-900 dark:text-red-100 mb-2">Issues Found:</p>
                        <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                          {documentVerification.pan.verification.issues.map((issue: string, idx: number) => (
                            <li key={idx}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {documentVerification.pan.verification.recommendations && documentVerification.pan.verification.recommendations.length > 0 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">Recommendations:</p>
                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                          {documentVerification.pan.verification.recommendations.map((rec: string, idx: number) => (
                            <li key={idx}>💡 {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="additionalInfo" className="text-base">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                value={formData.additionalInfo || ''}
                onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                className="text-lg mt-2"
                rows={6}
                placeholder="Any additional information relevant to this application..."
                data-testid="input-additional-info"
              />
            </div>
            <div>
              <Label htmlFor="supportDocument" className="text-base">Upload Supporting Documents (Optional)</Label>
              <div className="mt-2">
                <Input
                  id="supportDocument"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('supportingDocument', e)}
                  className="text-base"
                  data-testid="input-support-document"
                />
                {formData.supportingDocument && (
                  <div className="mt-2 flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>File uploaded</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-accent/50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Review Your Application</h3>
              <div className="space-y-3 text-base">
                <div className="flex justify-between">
                  <span className="font-medium">Applicant Name:</span>
                  <span>{formData.applicantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Annual Income:</span>
                  <span>₹{formData.annualIncome?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Aadhar Uploaded:</span>
                  <span>{formData.aadharDocument ? '✓ Yes' : '✗ No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">PAN Uploaded:</span>
                  <span>{formData.panDocument ? '✓ Yes' : '✗ No'}</span>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
              <p className="text-base">
                By submitting this application, you confirm that all information provided is accurate and complete.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{scheme.name}</CardTitle>
            <CardDescription className="text-lg">Complete your application in {totalSteps} steps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-8">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Step {currentStep} of {totalSteps}</span>
                <span className="font-medium">{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-6">
                {currentStep === 1 && 'Personal Information'}
                {currentStep === 2 && 'Financial & Banking Details'}
                {currentStep === 3 && 'Document Upload'}
                {currentStep === 4 && 'Additional Information'}
                {currentStep === 5 && 'Review & Submit'}
              </h2>
              {renderStep()}
            </div>

            <div className="flex gap-4 flex-wrap">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  size="lg"
                  data-testid="button-previous"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  {t('previous')}
                </Button>
              )}
              <Button
                onClick={() => saveDraftMutation.mutate()}
                variant="secondary"
                size="lg"
                disabled={saveDraftMutation.isPending}
                data-testid="button-save-draft"
              >
                <Save className="mr-2 h-5 w-5" />
                {t('save')} Draft
              </Button>
              <Button
                onClick={handleNext}
                size="lg"
                className="ml-auto"
                disabled={submitMutation.isPending}
                data-testid="button-next-submit"
              >
                {currentStep === totalSteps ? (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    {t('submit')} Application
                  </>
                ) : (
                  <>
                    {t('next')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
