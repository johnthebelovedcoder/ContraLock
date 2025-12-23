'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Settings as SettingsIcon,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import { aiService } from '@/lib/api/aiService';
import { useAIStore } from '@/lib/store/aiStore';

export default function AIAssistantPage() {
  const { user, isAuthenticated, initializeAuth, loading } = useAuthStore();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [projectDescription, setProjectDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [milestoneDescription, setMilestoneDescription] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [submittedDeliverable, setSubmittedDeliverable] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [contractText, setContractText] = useState('');
  const [conversationText, setConversationText] = useState('');
  const [loadingTool, setLoadingTool] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);

  useEffect(() => {
    // Initialize auth when component mounts
    initializeAuth();
  }, [initializeAuth]);

  // If still loading, show a loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading AI assistant...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'client') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Please log in as a client to access the AI assistant</p>
      </div>
    );
  }

  const {
    getMilestoneSuggestions,
    verifyDeliverable,
    analyzeDispute,
    milestoneSuggestions,
    deliverableVerification,
    disputeAnalysis,
    milestoneSuggestionsLoading,
    deliverableVerificationLoading,
    disputeAnalysisLoading
  } = useAIStore();

  const handleToolSubmit = async () => {
    if (!activeTool) return;

    setLoadingTool(true);

    try {
      let result;

      switch (activeTool) {
        case 'milestone-suggestions':
          result = await getMilestoneSuggestions({
            projectDescription,
            budget: parseFloat(budget) || 0,
            category: 'Development'
          });
          setAiResults(result);
          break;
        case 'deliverable-verification':
          result = await verifyDeliverable({
            milestoneDescription,
            acceptanceCriteria,
            submittedDeliverable
          });
          setAiResults(result);
          break;
        case 'dispute-analysis':
          result = await analyzeDispute({
            projectAgreement: 'Standard development agreement',
            disputeDescription
          });
          setAiResults(result);
          break;
        case 'pricing-advice':
          result = await aiService.getPricingAdvice({
            projectDescription,
            category: 'Development'
          });
          setAiResults(result);
          break;
        case 'contract-audit':
          result = await aiService.auditContract({
            contractText
          });
          setAiResults(result);
          break;
        case 'communication-assistant':
          result = await aiService.summarizeCommunication({
            conversation: conversationText
          });
          setAiResults(result);
          break;
        default:
          result = null;
      }
    } catch (error) {
      console.error('AI tool error:', error);
      setAiResults({ error: 'Failed to get AI analysis. Please try again.' });
    } finally {
      setLoadingTool(false);
    }
  };

  const renderToolForm = () => {
    if (!activeTool) return null;

    const toolConfig = {
      'milestone-suggestions': {
        title: 'Smart Milestone Generator',
        icon: FileText,
        inputs: [
          { label: 'Project Description', field: 'projectDescription', type: 'textarea', placeholder: 'Describe your project requirements...' },
          { label: 'Budget ($)', field: 'budget', type: 'input', placeholder: '5000' }
        ]
      },
      'deliverable-verification': {
        title: 'Deliverable Verification',
        icon: CheckCircle,
        inputs: [
          { label: 'Milestone Description', field: 'milestoneDescription', type: 'textarea', placeholder: 'Describe the milestone requirements...' },
          { label: 'Acceptance Criteria', field: 'acceptanceCriteria', type: 'textarea', placeholder: 'What needs to be completed for approval...' },
          { label: 'Submitted Deliverable', field: 'submittedDeliverable', type: 'textarea', placeholder: 'Describe what was delivered...' }
        ]
      },
      'dispute-analysis': {
        title: 'Dispute Analysis',
        icon: AlertTriangle,
        inputs: [
          { label: 'Dispute Description', field: 'disputeDescription', type: 'textarea', placeholder: 'Describe the dispute...' }
        ]
      },
      'pricing-advice': {
        title: 'Pricing Advisor',
        icon: DollarSign,
        inputs: [
          { label: 'Project Description', field: 'projectDescription', type: 'textarea', placeholder: 'Describe your project...' },
          { label: 'Category', field: 'category', type: 'input', placeholder: 'e.g., Development, Design' }
        ]
      },
      'contract-audit': {
        title: 'Contract Auditor',
        icon: FileText,
        inputs: [
          { label: 'Contract Text', field: 'contractText', type: 'textarea', placeholder: 'Paste your contract text here...' }
        ]
      },
      'communication-assistant': {
        title: 'Communication Assistant',
        icon: MessageCircle,
        inputs: [
          { label: 'Conversation Text', field: 'conversationText', type: 'textarea', placeholder: 'Paste your conversation here...' }
        ]
      }
    };

    const config = toolConfig[activeTool as keyof typeof toolConfig];
    const IconComponent = config.icon;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <IconComponent className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium">{config.title}</h3>
        </div>

        {config.inputs.map((input, index) => (
          <div key={index} className="space-y-2">
            <Label>{input.label}</Label>
            {input.type === 'textarea' ? (
              <Textarea
                value={input.field === 'projectDescription' ? projectDescription :
                      input.field === 'milestoneDescription' ? milestoneDescription :
                      input.field === 'acceptanceCriteria' ? acceptanceCriteria :
                      input.field === 'submittedDeliverable' ? submittedDeliverable :
                      input.field === 'disputeDescription' ? disputeDescription :
                      input.field === 'contractText' ? contractText :
                      input.field === 'conversationText' ? conversationText : ''}
                onChange={(e) => {
                  if (input.field === 'projectDescription') setProjectDescription(e.target.value);
                  else if (input.field === 'milestoneDescription') setMilestoneDescription(e.target.value);
                  else if (input.field === 'acceptanceCriteria') setAcceptanceCriteria(e.target.value);
                  else if (input.field === 'submittedDeliverable') setSubmittedDeliverable(e.target.value);
                  else if (input.field === 'disputeDescription') setDisputeDescription(e.target.value);
                  else if (input.field === 'contractText') setContractText(e.target.value);
                  else if (input.field === 'conversationText') setConversationText(e.target.value);
                }}
                placeholder={input.placeholder}
                rows={4}
              />
            ) : (
              <Input
                type="text"
                value={input.field === 'budget' ? budget :
                      input.field === 'category' ? 'Development' : ''}
                onChange={(e) => {
                  if (input.field === 'budget') setBudget(e.target.value);
                }}
                placeholder={input.placeholder}
              />
            )}
          </div>
        ))}

        <Button
          onClick={handleToolSubmit}
          disabled={loadingTool}
          className="w-full"
        >
          {loadingTool ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Get AI Analysis
            </>
          )}
        </Button>

        {aiResults && (
          <div className="mt-6">
            <h4 className="font-medium mb-2">AI Analysis Results</h4>
            {aiResults.error ? (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-destructive">{aiResults.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTool === 'milestone-suggestions' && aiResults.suggestedMilestones && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <h5 className="font-medium mb-2">Suggested Milestones</h5>
                    <div className="space-y-3">
                      {aiResults.suggestedMilestones.map((milestone: any, index: number) => (
                        <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded border">
                          <div className="flex justify-between items-start">
                            <h6 className="font-medium">{milestone.title}</h6>
                            <span className="text-sm font-medium">${milestone.amount?.toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>~{milestone.deadlineDays} days</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {aiResults.confidenceScore && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Confidence Score</span>
                          <span>{aiResults.confidenceScore}%</span>
                        </div>
                        <Progress value={aiResults.confidenceScore} className="h-2" />
                      </div>
                    )}
                    {aiResults.recommendations && aiResults.recommendations.length > 0 && (
                      <div className="mt-3">
                        <h6 className="font-medium mb-1">Recommendations</h6>
                        <ul className="text-sm space-y-1">
                          {aiResults.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeTool === 'deliverable-verification' && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-medium">Verification Results</h5>
                      <Badge variant={
                        aiResults.recommendation === 'approve' ? 'default' :
                        aiResults.recommendation === 'request_revision' ? 'secondary' :
                        'destructive'
                      }>
                        {aiResults.recommendation?.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Confidence Score</span>
                        <span>{aiResults.confidenceScore}%</span>
                      </div>
                      <Progress value={aiResults.confidenceScore} className="h-2" />
                    </div>

                    {aiResults.feedback && aiResults.feedback.length > 0 && (
                      <div className="mb-3">
                        <h6 className="font-medium mb-1">Feedback</h6>
                        <ul className="text-sm space-y-1">
                          {aiResults.feedback.map((f: string, idx: number) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiResults.specificFeedback && aiResults.specificFeedback.length > 0 && (
                      <div>
                        <h6 className="font-medium mb-1">Specific Feedback</h6>
                        <ul className="text-sm space-y-1">
                          {aiResults.specificFeedback.map((f: string, idx: number) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeTool === 'dispute-analysis' && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <h5 className="font-medium mb-2">Dispute Analysis</h5>

                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Confidence Level</span>
                        <span>{aiResults.confidenceLevel}%</span>
                      </div>
                      <Progress value={aiResults.confidenceLevel} className="h-2" />
                    </div>

                    {aiResults.keyIssues && aiResults.keyIssues.length > 0 && (
                      <div className="mb-3">
                        <h6 className="font-medium mb-1">Key Issues</h6>
                        <ul className="text-sm space-y-1">
                          {aiResults.keyIssues.map((issue: string, idx: number) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiResults.reasoning && (
                      <div className="mb-3">
                        <h6 className="font-medium mb-1">Reasoning</h6>
                        <p className="text-sm">{aiResults.reasoning}</p>
                      </div>
                    )}

                    {aiResults.recommendedResolution && (
                      <div>
                        <h6 className="font-medium mb-1">Recommended Resolution</h6>
                        <div className="text-sm space-y-1">
                          <p><span className="font-medium">Decision:</span> {aiResults.recommendedResolution.decision?.replace('_', ' ')}</p>
                          <p><span className="font-medium">To Freelancer:</span> ${aiResults.recommendedResolution.amountToFreelancer / 100}</p>
                          <p><span className="font-medium">To Client:</span> ${aiResults.recommendedResolution.amountToClient / 100}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTool !== 'milestone-suggestions' && activeTool !== 'deliverable-verification' && activeTool !== 'dispute-analysis' && (
                  <div className="p-4 bg-muted rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(aiResults, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground">
          Advanced AI tools to help you manage your projects and workflows
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Dialog>
          <DialogTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  Smart Milestone Generator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Suggests ideal breakdowns, recommends realistic timelines, and points out missing deliverables for your projects.
                </p>
                <Button className="w-full" variant="outline" onClick={() => setActiveTool('milestone-suggestions')}>
                  Use Tool <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Smart Milestone Generator</DialogTitle>
            </DialogHeader>
            {renderToolForm()}
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  Deliverable Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Auto-checks submitted work, suggests potential issues, and provides a confidence level score.
                </p>
                <Button className="w-full" variant="outline" onClick={() => setActiveTool('deliverable-verification')}>
                  Verify <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Deliverable Verification</DialogTitle>
            </DialogHeader>
            {renderToolForm()}
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                  Dispute Prediction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Alerts when communication becomes risky and suggests early mediation opportunities.
                </p>
                <Button className="w-full" variant="outline" onClick={() => setActiveTool('dispute-analysis')}>
                  Analyze <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Dispute Analysis</DialogTitle>
            </DialogHeader>
            {renderToolForm()}
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  Pricing Advisor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Compares your project to market rates and suggests adjustments if overpriced or underpriced.
                </p>
                <Button className="w-full" variant="outline" onClick={() => setActiveTool('pricing-advice')}>
                  Advise <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pricing Advisor</DialogTitle>
            </DialogHeader>
            {renderToolForm()}
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  Contract Auditor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Highlights vague language and proposes additional clauses for clarity in contracts.
                </p>
                <Button className="w-full" variant="outline" onClick={() => setActiveTool('contract-audit')}>
                  Audit <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contract Auditor</DialogTitle>
            </DialogHeader>
            {renderToolForm()}
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  Communication Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Summarizes chat conversations and suggests polite revision messages.
                </p>
                <Button className="w-full" variant="outline" onClick={() => setActiveTool('communication-assistant')}>
                  Assist <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Communication Assistant</DialogTitle>
            </DialogHeader>
            {renderToolForm()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}