const axios = require('axios');
const { Project, Milestone, Dispute, Message } = require('../models/modelManager');

class ContentModerationService {
  // Moderate text content using AI/ML
  async moderateText(content, context = 'general') {
    // In a real implementation, this would use a content moderation API like Google Perspective API
    // For now, implementing basic checks
    
    const flaggedWords = [
      'hate', 'violence', 'harassment', 'spam', 'abuse', 'threat', 'attack', 
      'harmful', 'inappropriate', 'discriminatory', 'offensive', 'explicit'
    ];
    
    // Check for flagged words
    const lowerContent = content.toLowerCase();
    const flagged = flaggedWords.filter(word => lowerContent.includes(word));
    
    if (flagged.length > 0) {
      return {
        isFlagged: true,
        flaggedWords: flagged,
        confidence: 90, // Basic confidence
        message: 'Content contains potentially inappropriate language'
      };
    }
    
    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.8) {
      return {
        isFlagged: true,
        flaggedWords: ['excessive caps'],
        confidence: 70,
        message: 'Content has excessive capitalization'
      };
    }
    
    // Check for excessive length (potential spam)
    if (content.length > 1000 && context !== 'description') {
      return {
        isFlagged: true,
        flaggedWords: ['excessive length'],
        confidence: 60,
        message: 'Content exceeds typical length for this context'
      };
    }
    
    return {
      isFlagged: false,
      flaggedWords: [],
      confidence: 95,
      message: 'Content appears appropriate'
    };
  }

  // Moderate project content
  async moderateProject(project) {
    const issues = [];
    
    // Moderate project title
    const titleModeration = await this.moderateText(project.title, 'title');
    if (titleModeration.isFlagged) {
      issues.push({
        field: 'title',
        ...titleModeration
      });
    }
    
    // Moderate project description
    const descriptionModeration = await this.moderateText(project.description, 'description');
    if (descriptionModeration.isFlagged) {
      issues.push({
        field: 'description',
        ...descriptionModeration
      });
    }
    
    return {
      projectId: project._id,
      issues,
      isApproved: issues.length === 0,
      message: issues.length === 0 ? 'Project content approved' : `${issues.length} issues found`
    };
  }

  // Moderate milestone content
  async moderateMilestone(milestone) {
    const issues = [];
    
    // Moderate milestone title
    const titleModeration = await this.moderateText(milestone.title, 'title');
    if (titleModeration.isFlagged) {
      issues.push({
        field: 'title',
        ...titleModeration
      });
    }
    
    // Moderate milestone description
    const descriptionModeration = await this.moderateText(milestone.description, 'description');
    if (descriptionModeration.isFlagged) {
      issues.push({
        field: 'description',
        ...descriptionModeration
      });
    }
    
    // Moderate acceptance criteria
    const criteriaModeration = await this.moderateText(milestone.acceptanceCriteria, 'criteria');
    if (criteriaModeration.isFlagged) {
      issues.push({
        field: 'acceptanceCriteria',
        ...criteriaModeration
      });
    }
    
    return {
      milestoneId: milestone._id,
      issues,
      isApproved: issues.length === 0,
      message: issues.length === 0 ? 'Milestone content approved' : `${issues.length} issues found`
    };
  }

  // Moderate dispute content
  async moderateDispute(dispute) {
    const issues = [];
    
    // Moderate dispute reason
    const reasonModeration = await this.moderateText(dispute.reason, 'dispute');
    if (reasonModeration.isFlagged) {
      issues.push({
        field: 'reason',
        ...reasonModeration
      });
    }
    
    // Moderate evidence descriptions if any
    if (dispute.evidence && Array.isArray(dispute.evidence)) {
      for (let i = 0; i < dispute.evidence.length; i++) {
        const evidence = dispute.evidence[i];
        if (evidence.description) {
          const evidenceModeration = await this.moderateText(evidence.description, 'evidence');
          if (evidenceModeration.isFlagged) {
            issues.push({
              field: `evidence[${i}].description`,
              ...evidenceModeration
            });
          }
        }
      }
    }
    
    return {
      disputeId: dispute._id,
      issues,
      isApproved: issues.length === 0,
      message: issues.length === 0 ? 'Dispute content approved' : `${issues.length} issues found`
    };
  }

  // Moderate message content
  async moderateMessage(message) {
    const contentModeration = await this.moderateText(message.content, 'message');
    
    if (contentModeration.isFlagged) {
      return {
        messageId: message._id,
        isFlagged: true,
        ...contentModeration
      };
    }
    
    return {
      messageId: message._id,
      isFlagged: false,
      message: 'Message content approved'
    };
  }

  // Moderate file content (placeholder for file scanning)
  async moderateFile(filePath, fileName) {
    // In a real implementation, this would scan files for malware, inappropriate content, etc.
    // This would involve integrating with antivirus software or using cloud scanning services
    
    // For now, just basic file type checking
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt', '.zip'];
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(ext)) {
      return {
        isFlagged: true,
        flaggedReason: 'File type not allowed',
        confidence: 100,
        message: `File type ${ext} is not allowed`
      };
    }
    
    return {
      isFlagged: false,
      flaggedReason: null,
      confidence: 95,
      message: 'File appears appropriate'
    };
  }

  // Bulk moderation for a project
  async moderateProjectCompletely(projectId) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    
    const results = {
      project: await this.moderateProject(project),
      milestones: [],
      disputes: [],
      messages: []
    };
    
    // Moderate all milestones in the project
    if (project.milestones) {
      for (const milestoneId of project.milestones) {
        const milestone = await Milestone.findById(milestoneId);
        if (milestone) {
          results.milestones.push(await this.moderateMilestone(milestone));
        }
      }
    }
    
    // Moderate all disputes in the project
    const disputes = await Dispute.find({ project: projectId });
    for (const dispute of disputes) {
      results.disputes.push(await this.moderateDispute(dispute));
    }
    
    // Moderate all messages in the project (simplified)
    const messages = await Message.find({ projectId });
    for (const message of messages) {
      results.messages.push(await this.moderateMessage(message));
    }
    
    // Calculate overall project status
    const allResults = [
      results.project,
      ...results.milestones,
      ...results.disputes,
      ...results.messages
    ];
    
    const totalIssues = allResults.filter(r => r.issues || r.isFlagged).length;
    const flaggedItems = allResults.filter(r => r.isFlagged || (r.issues && r.issues.length > 0)).length;
    
    results.overall = {
      totalItems: allResults.length,
      flaggedItems,
      totalIssues,
      isClean: flaggedItems === 0,
      summary: flaggedItems === 0 ? 'Project content is clean' : `${flaggedItems} flagged items with ${totalIssues} total issues`
    };
    
    return results;
  }
}

module.exports = new ContentModerationService();