const OpenAI = require('openai');
const Dispute = require('../models/Dispute');
const Project = require('../models/Project');
const Milestone = require('../models/Milestone');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class AIService {
  // Process dispute for auto review
  async processDisputeForAutoReview(disputeId) {
    try {
      const dispute = await Dispute.findById(disputeId);
      const project = await Project.findById(dispute.project);
      const milestone = await Milestone.findById(dispute.milestone);

      // Create an AI prompt to analyze the dispute
      const prompt = `
        Analyze this freelance project dispute:
        
        Project: ${project.title}
        Description: ${project.description}
        Milestone: ${milestone.title}
        Milestone description: ${milestone.description}
        Acceptance criteria: ${milestone.acceptanceCriteria}
        Dispute reason: ${dispute.reason}
        
        Evidence: ${dispute.evidence ? dispute.evidence.map(e => e.filename || e.url).join(', ') : 'None provided'}
        
        Based on the project agreement and dispute details, provide:
        1. A confidence score (0-100) for the freelancer's position
        2. A confidence score (0-100) for the client's position
        3. Recommended resolution
        4. Key issues identified
        5. Brief reasoning
        
        Return the response in JSON format with these fields:
        {
          "confidenceScore": {"freelancer": number, "client": number},
          "recommendedResolution": "full_payment_to_freelancer|partial_payment|full_refund_to_client|revision_required",
          "keyIssues": [string],
          "reasoning": string,
          "decision": string
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content);

      // Update dispute with AI analysis
      dispute.aiAnalysis = {
        confidenceScore: analysis.confidenceScore,
        recommendedResolution: analysis.recommendedResolution,
        keyIssues: analysis.keyIssues,
        reasoning: analysis.reasoning,
        decision: analysis.decision,
        analyzedAt: new Date()
      };

      // If confidence is high in one side, auto-resolve with a recommendation
      if (analysis.confidenceScore.freelancer > 80 || analysis.confidenceScore.client > 80) {
        dispute.status = 'RESOLVED';
        dispute.resolutionPhase = 'AUTO_RESOLVED';
        dispute.autoResolved = true;
        dispute.resolution = {
          decision: analysis.recommendedResolution,
          reason: `AI auto-resolution: ${analysis.reasoning}`,
          aiRecommended: true,
          resolvedAt: new Date()
        };
      } else {
        // Move to human mediation if confidence is low
        dispute.status = 'IN_MEDIATION';
        dispute.resolutionPhase = 'MEDIATION';
      }

      await dispute.save();
      return dispute;
    } catch (error) {
      console.error('AI dispute analysis error:', error);
      throw error;
    }
  }

  // Generate dispute report
  async generateDisputeReport(disputeId) {
    try {
      const dispute = await Dispute.findById(disputeId);
      const project = await Project.findById(dispute.project);
      const milestone = await Milestone.findById(dispute.milestone);

      const prompt = `
        Generate a comprehensive dispute report for this freelance project dispute:
        
        Project: ${project.title}
        Description: ${project.description}
        Budget: $${project.budget / 100}
        Milestone: ${milestone.title}
        Milestone amount: $${milestone.amount / 100}
        Dispute reason: ${dispute.reason}
        Raised by: ${dispute.raisedBy}
        Status: ${dispute.status}
        
        Evidence: ${dispute.evidence ? dispute.evidence.map(e => e.filename || e.url).join(', ') : 'None provided'}
        
        Include in the report:
        1. Summary of dispute
        2. Stakeholder positions
        3. Evidence analysis
        4. Risk assessment
        5. Recommended resolution path
        6. Potential outcomes
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const report = JSON.parse(response.choices[0].message.content);
      return report;
    } catch (error) {
      console.error('AI report generation error:', error);
      throw error;
    }
  }

  // Process milestone for deliverable matching
  async analyzeMilestoneDeliverables(milestoneId) {
    try {
      const milestone = await Milestone.findById(milestoneId);
      const project = await Project.findById(milestone.project);

      if (!milestone.deliverables || milestone.deliverables.length === 0) {
        return {
          confidence: 0,
          issues: ['No deliverables submitted'],
          matchedCriteria: [],
          unmatchedCriteria: milestone.acceptanceCriteria ? milestone.acceptanceCriteria.split('\n') : []
        };
      }

      const prompt = `
        Analyze this milestone deliverable against acceptance criteria:
        
        Project: ${project.title}
        Milestone: ${milestone.title}
        Acceptance criteria: ${milestone.acceptanceCriteria}
        Submitted deliverables: ${milestone.deliverables.map(d => d.filename || d.url || d.description).join(', ')}
        Submission notes: ${milestone.submissionNotes || 'None'}
        
        Analyze:
        1. Match between deliverables and acceptance criteria
        2. Quality of deliverables
        3. Completeness
        4. Potential issues
        
        Return response in JSON format:
        {
          "confidence": number (0-100),
          "matchedCriteria": [string],
          "unmatchedCriteria": [string],
          "issues": [string],
          "qualityScore": number (1-10),
          "recommendation": "approve|request_revision|dispute",
          "feedback": string
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      return analysis;
    } catch (error) {
      console.error('AI milestone analysis error:', error);
      throw error;
    }
  }

  // Generate milestone suggestions based on project description
  async generateMilestoneSuggestions(projectDescription, totalBudget, category) {
    try {
      const prompt = `
        Based on this project description, suggest an optimal milestone structure:
        
        Project description: ${projectDescription}
        Total budget: $${totalBudget / 100}
        Category: ${category}
        
        Provide suggestions in JSON format:
        {
          "milestones": [
            {
              "title": string,
              "description": string,
              "amount": number (in cents),
              "percentage": number (0-100),
              "deadlineOffsetDays": number,
              "acceptanceCriteria": string
            }
          ],
          "recommendation": string,
          "riskFactors": [string],
          "timelineSuggestion": string
        }
        
        Make sure the total amount of all milestones equals the total budget.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const suggestions = JSON.parse(response.choices[0].message.content);
      return suggestions;
    } catch (error) {
      console.error('AI milestone suggestion error:', error);
      throw error;
    }
  }

  // Predict dispute likelihood
  async predictDisputeLikelihood(projectId) {
    try {
      const project = await Project.findById(projectId);
      const milestones = await Milestone.find({ project: projectId });

      const prompt = `
        Analyze this project for potential dispute risk:
        
        Project: ${project.title}
        Description: ${project.description}
        Category: ${project.category}
        Budget: $${project.budget / 100}
        Deadline: ${project.deadline}
        
        Milestones: ${milestones.map(ms => 
          `Title: ${ms.title}, Status: ${ms.status}, Amount: $${ms.amount / 100}, Deadline: ${ms.deadline}`
        ).join('; ')}
        
        Communication patterns, if available: ${project.activityLog ? project.activityLog.length : 0} activity events
        
        Analyze and provide:
        1. Dispute probability (0-100)
        2. Risk factors
        3. Mitigation suggestions
        4. Warning signs to monitor
        
        Return in JSON:
        {
          "disputeProbability": number (0-100),
          "riskFactors": [string],
          "mitigationSuggestions": [string],
          "warningSigns": [string],
          "monitoringRecommendations": [string]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      return analysis;
    } catch (error) {
      console.error('AI dispute prediction error:', error);
      throw error;
    }
  }

  // Process dispute for escalation to arbitration
  async evaluateForArbitration(disputeId) {
    try {
      const dispute = await Dispute.findById(disputeId);

      // Check if dispute should be escalated to arbitration
      let shouldEscalate = false;
      let reason = '';

      // If there's already an AI analysis with low confidence scores, escalate
      if (dispute.aiAnalysis) {
        const freelancerConfidence = dispute.aiAnalysis.confidenceScore?.freelancer || 0;
        const clientConfidence = dispute.aiAnalysis.confidenceScore?.client || 0;

        if (freelancerConfidence < 60 && clientConfidence < 60) {
          shouldEscalate = true;
          reason = 'Low confidence in AI analysis for both parties';
        }
      }

      // If mediation has been ongoing for more than 48 hours without resolution, escalate
      if (dispute.status === 'IN_MEDIATION' && dispute.mediator) {
        const mediationStart = dispute.updatedAt;
        if (mediationStart && (Date.now() - new Date(mediationStart).getTime()) > 48 * 60 * 60 * 1000) {
          shouldEscalate = true;
          reason = 'Mediation period exceeded 48 hours without resolution';
        }
      }

      // If there are more than 5 messages in dispute without resolution
      if (dispute.messages && dispute.messages.length > 5) {
        shouldEscalate = true;
        reason = 'High number of dispute messages without resolution';
      }

      if (shouldEscalate) {
        dispute.status = 'IN_ARBITRATION';
        dispute.resolutionPhase = 'ARBITRATION';
        await dispute.save();
      }

      return {
        shouldEscalate,
        reason,
        dispute
      };
    } catch (error) {
      console.error('AI escalation evaluation error:', error);
      throw error;
    }
  }
}

module.exports = new AIService();