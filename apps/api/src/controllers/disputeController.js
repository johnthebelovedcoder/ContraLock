const Dispute = require('../models/Dispute');
const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } = require('../errors/AppError');
const stripeService = require('../services/paymentService');
const { processAIAnalysis } = require('../services/aiService');
const contentModerationService = require('../services/contentModerationService');
const { notifyProject } = require('../socket/server');
const { Op } = require('sequelize');

// Get disputes for a user
const getUserDisputes = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { status, limit = 20, offset = 0 } = req.query;

    // Validate query parameters
    const validLimit = Math.min(Math.max(parseInt(limit), 1), 100); // Limit to 1-100 results
    const validOffset = Math.max(parseInt(offset), 0);

    // Verify user exists and is active
    const user = await User.findById(userId);
    if (!user || user.status === 'suspended') {
      return next(new ForbiddenError('User account is suspended'));
    }

    const whereConditions = {
      [Op.or]: [
        { 'raisedBy': userId },
        { 'project.client': userId },
        { 'project.freelancer': userId }
      ]
    };

    if (status) {
      // Validate status parameter
      const validStatuses = [
        'PENDING_FEE', 'PENDING_REVIEW', 'SELF_RESOLUTION',
        'IN_MEDIATION', 'IN_ARBITRATION', 'AWAITING_OUTCOME',
        'RESOLVED', 'ESCALATED'
      ];
      if (!validStatuses.includes(status)) {
        return next(new BadRequestError(`Invalid status: ${status}`));
      }
      whereConditions.status = status;
    }

    const disputes = await Dispute.find({
      where: whereConditions,
      order: [['createdAt', 'DESC']], // Sequelize format for ordering
      limit: validLimit,
      offset: validOffset
    });

    // Populate related data manually
    const populatedDisputes = await Dispute.populate(disputes, [
      { path: 'project', select: 'title budget' },
      { path: 'milestone', select: 'title amount' },
      { path: 'raisedBy', select: 'firstName lastName email' },
      { path: 'mediator', select: 'firstName lastName' },
      { path: 'arbitrator', select: 'firstName lastName' }
    ]);

    const total = await Dispute.count({ where: whereConditions });

    res.json({
      items: populatedDisputes,
      pagination: {
        total,
        limit: validLimit,
        offset: validOffset,
        hasMore: validOffset + validLimit < total
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get dispute details
const getDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Validate dispute ID format
    if (!id || id.length < 10) {
      return next(new BadRequestError('Invalid dispute ID'));
    }

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return next(new NotFoundError('Dispute not found'));
    }

    // Verify user exists and is active
    const user = await User.findById(userId);
    if (!user || user.status === 'suspended') {
      return next(new ForbiddenError('User account is suspended'));
    }

    // Populate related data manually
    const populatedDispute = await Dispute.populate([dispute], [
      { path: 'project', select: 'title budget client freelancer' },
      { path: 'milestone', select: 'title description amount status' },
      { path: 'raisedBy', select: 'firstName lastName email' },
      { path: 'mediator', select: 'firstName lastName' },
      { path: 'arbitrator', select: 'firstName lastName' }
    ]);

    const disputeWithPopulatedData = populatedDispute[0];
    if (!disputeWithPopulatedData) {
      return next(new NotFoundError('Dispute not found'));
    }

    // Enhanced security check: verify user is part of the dispute
    const project = await Project.findById(disputeWithPopulatedData.project);
    if (!project) {
      return next(new NotFoundError('Project not found'));
    }

    // Check if user is part of the dispute (raisedBy, client, or freelancer)
    const isDisputeParticipant = (
      disputeWithPopulatedData.raisedBy.toString() === userId ||
      project.client.toString() === userId ||
      (project.freelancer && project.freelancer.toString() === userId)
    );

    // Check if user is an arbitrator assigned to this dispute
    const isArbitrator = disputeWithPopulatedData.arbitrator &&
                        disputeWithPopulatedData.arbitrator.toString() === userId;

    // Check if user is a mediator assigned to this dispute
    const isMediator = disputeWithPopulatedData.mediator &&
                      disputeWithPopulatedData.mediator.toString() === userId;

    // Check if user is an admin
    const isAdmin = user.role === 'admin';

    if (!isDisputeParticipant && !isArbitrator && !isMediator && !isAdmin) {
      return next(new ForbiddenError('Not authorized to view this dispute'));
    }

    res.json(disputeWithPopulatedData);
  } catch (error) {
    next(error);
  }
};

// Create a dispute
const createDispute = async (req, res, next) => {
  try {
    const { projectId, milestoneId, reason, evidence = [] } = req.body;
    const userId = req.user.userId;

    // Verify user exists and is active
    const user = await User.findById(userId);
    if (!user || user.status === 'suspended') {
      return next(new ForbiddenError('User account is suspended'));
    }

    // Verify user is part of the project
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new NotFoundError('Project not found'));
    }

    // Check if user is client or freelancer on the project
    const isClient = project.client.toString() === userId;
    const isFreelancer = project.freelancer && project.freelancer.toString() === userId;

    if (!isClient && !isFreelancer) {
      return next(new ForbiddenError('Not authorized to dispute this project'));
    }

    // Verify milestone belongs to project
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return next(new NotFoundError('Milestone not found'));
    }
    if (milestone.project.toString() !== projectId) {
      return next(new NotFoundError('Milestone does not belong to this project'));
    }

    // Check if user has already raised a dispute for this milestone recently (rate limiting)
    const recentDispute = await Dispute.findOne({
      project: projectId,
      milestone: milestoneId,
      raisedBy: userId,
      createdAt: {
        [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
      }
    });

    if (recentDispute) {
      return next(new BadRequestError('A dispute was already raised for this milestone by you in the last 24 hours'));
    }

    // Check if dispute already exists for this milestone by any party
    const existingDispute = await Dispute.findOne({
      project: projectId,
      milestone: milestoneId
    });

    if (existingDispute) {
      return next(new BadRequestError('A dispute already exists for this milestone'));
    }

    // Validate reason length
    if (!reason || reason.length < 10) {
      return next(new BadRequestError('Dispute reason must be at least 10 characters'));
    }
    if (reason.length > 1000) {
      return next(new BadRequestError('Dispute reason cannot exceed 1000 characters'));
    }

    // Validate evidence files before processing
    const validatedEvidence = await validateEvidenceFiles(evidence);

    // Calculate dispute fee based on milestone amount
    const disputeAmount = milestone.amount; // Amount in cents
    const disputeFee = calculateDisputeFee(disputeAmount);

    // Moderate dispute content before creation
    const moderationResult = await contentModerationService.moderateDispute({
      _id: null,
      reason,
      evidence: validatedEvidence
    });

    if (!moderationResult.isApproved) {
      return next(new BadRequestError(`Dispute content flagged: ${moderationResult.message}`));
    }

    // Create dispute with new status system
    const dispute = new Dispute({
      project: projectId,
      milestone: milestoneId,
      raisedBy: userId,
      reason,
      evidence: validatedEvidence.map(item => ({
        id: item.id || generateEvidenceId(),
        filename: item.filename,
        url: item.url,
        type: item.type || getMimeType(item.filename) || 'file',
        uploadedBy: userId,
        uploadedAt: new Date(),
        verified: false, // Evidence verification status
        metadata: {
          size: item.size,
          originalName: item.originalName || item.filename,
          hash: item.hash || generateFileHash(item) // For integrity verification
        }
      })),
      status: 'PENDING_FEE', // New status system
      disputeFee: {
        clientFee: disputeFee.client,
        freelancerFee: disputeFee.freelancer,
        totalAmount: disputeFee.total,
        status: 'PENDING', // Fee payment status
        disputeAmount: disputeAmount
      },
      evidenceSubmitted: {
        client: {
          submittedAt: isClient ? new Date() : null,
          evidenceCount: isClient ? validatedEvidence.length : 0
        },
        freelancer: {
          submittedAt: isFreelancer ? new Date() : null,
          evidenceCount: isFreelancer ? validatedEvidence.length : 0
        }
      },
      timeline: [{
        status: 'PENDING_FEE',
        timestamp: new Date(),
        note: 'Dispute created, awaiting fee payment'
      }]
    });

    await dispute.save();

    // Update milestone status
    milestone.status = 'DISPUTED';
    await milestone.save();

    // Update project status to disputed
    project.status = 'DISPUTED';
    await project.save();

    // Add to project activity log
    project.activityLog.push({
      action: 'DISPUTE_RAISED',
      performedBy: userId,
      details: {
        milestoneId: milestoneId,
        disputeId: dispute._id,
        reason: reason
      }
    });
    await project.save();

    // Notify project participants
    notifyProject(projectId, 'dispute-raised', {
      disputeId: dispute._id,
      milestoneId,
      raisedBy: userId,
      timestamp: new Date(),
      message: `Dispute raised for milestone "${milestone.title}". Fee of $${(disputeFee.total/100).toFixed(2)} required.`
    });

    res.status(201).json({
      dispute,
      message: `Dispute created successfully. Fee of $${(disputeFee.total/100).toFixed(2)} required for processing.`
    });
  } catch (error) {
    next(error);
  }
};

// Validate evidence files
async function validateEvidenceFiles(evidence) {
  if (!evidence || !Array.isArray(evidence)) {
    return [];
  }

  const validatedEvidence = [];

  for (const item of evidence) {
    // Validate file type
    if (!isValidFileType(item.filename || item.type)) {
      throw new BadRequestError(`Invalid file type: ${item.filename || item.type}`);
    }

    // Validate file size (max 10MB)
    if (item.size && item.size > 10 * 1024 * 1024) { // 10MB in bytes
      throw new BadRequestError(`File too large: ${item.filename}. Maximum size is 10MB.`);
    }

    validatedEvidence.push({
      ...item,
      id: generateEvidenceId(),
      validatedAt: new Date(),
      validatedBy: 'system'
    });
  }

  return validatedEvidence;
}

// Check if file type is valid
function isValidFileType(filenameOrType) {
  const validTypes = [
    'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'rtf',
    'zip', 'rar', '7z', 'tar', 'gz', 'mp4', 'avi', 'mov', 'wmv'
  ];

  const extension = (filenameOrType || '').toLowerCase().split('.').pop();
  return validTypes.includes(extension);
}

// Generate evidence ID
function generateEvidenceId() {
  return `evid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get MIME type from filename
function getMimeType(filename) {
  const extension = (filename || '').toLowerCase().split('.').pop();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'rtf': 'application/rtf',
    'zip': 'application/zip',
    'rar': 'application/vnd.rar',
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime'
  };

  return mimeTypes[extension] || 'application/octet-stream';
}

// Generate file hash for integrity verification
function generateFileHash(file) {
  // In a real implementation, this would generate an actual hash
  // For now, we'll return a placeholder
  return `hash_${Date.now()}`;
}

// Submit additional evidence to a dispute
const submitDisputeEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { evidence = [] } = req.body;

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return next(new NotFoundError('Dispute not found'));
    }

    // Verify user is part of the dispute
    const project = await Project.findById(dispute.project);
    const isClient = project.client.toString() === userId;
    const isFreelancer = project.freelancer && project.freelancer.toString() === userId;

    if (!isClient && !isFreelancer) {
      return next(new ForbiddenError('Not authorized to submit evidence to this dispute'));
    }

    // Validate new evidence
    const validatedEvidence = await validateEvidenceFiles(evidence);

    // Update dispute with new evidence
    const newEvidence = validatedEvidence.map(item => ({
      id: generateEvidenceId(),
      filename: item.filename,
      url: item.url,
      type: item.type || getMimeType(item.filename),
      uploadedBy: userId,
      uploadedAt: new Date(),
      verified: false,
      metadata: {
        size: item.size,
        originalName: item.originalName || item.filename,
        hash: item.hash || generateFileHash(item)
      }
    }));

    // Add to existing evidence
    if (!dispute.evidence) {
      dispute.evidence = [];
    }
    dispute.evidence = [...dispute.evidence, ...newEvidence];

    // Update evidence tracking
    if (isClient) {
      dispute.evidenceSubmitted.client = {
        ...dispute.evidenceSubmitted.client,
        submittedAt: new Date(),
        evidenceCount: (dispute.evidenceSubmitted.client.evidenceCount || 0) + newEvidence.length
      };
    } else if (isFreelancer) {
      dispute.evidenceSubmitted.freelancer = {
        ...dispute.evidenceSubmitted.freelancer,
        submittedAt: new Date(),
        evidenceCount: (dispute.evidenceSubmitted.freelancer.evidenceCount || 0) + newEvidence.length
      };
    }

    // Add to timeline
    dispute.timeline.push({
      status: dispute.status, // Keep current status
      timestamp: new Date(),
      note: `Evidence submitted by ${isClient ? 'client' : 'freelancer'}`,
      action: 'evidence_submitted',
      submittedBy: userId
    });

    await dispute.save();

    // Notify project participants
    const notifyProject = require('../socket/server').notifyProject;
    notifyProject(dispute.project.toString(), 'dispute-evidence-submitted', {
      disputeId: dispute._id,
      submittedBy: userId,
      evidenceCount: newEvidence.length,
      message: `${isClient ? 'Client' : 'Freelancer'} submitted ${newEvidence.length} new evidence item(s)`
    });

    res.status(201).json({
      message: `${newEvidence.length} evidence item(s) submitted successfully`,
      dispute
    });
  } catch (error) {
    next(error);
  }
};

// Submit dispute appeal
const submitDisputeAppeal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { reason, evidence = [] } = req.body;

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return next(new NotFoundError('Dispute not found'));
    }

    // Verify user is part of the dispute (client or freelancer)
    const project = await Project.findById(dispute.project);
    const isClient = project.client.toString() === userId;
    const isFreelancer = project.freelancer && project.freelancer.toString() === userId;

    if (!isClient && !isFreelancer) {
      return next(new ForbiddenError('Not authorized to appeal this dispute'));
    }

    // Verify that the dispute is resolved (appeals only for resolved disputes)
    if (dispute.status !== 'RESOLVED') {
      return next(new BadRequestError('Appeals can only be submitted for resolved disputes'));
    }

    // Check if an appeal already exists
    if (dispute.appeal && dispute.appeal.status !== 'REJECTED') {
      return next(new BadRequestError('An appeal has already been submitted for this dispute'));
    }

    // Validate reason
    if (!reason || reason.length < 10) {
      return next(new BadRequestError('Appeal reason must be at least 10 characters'));
    }

    // Validate evidence files
    const validatedEvidence = await validateEvidenceFiles(evidence);

    // Create appeal object
    const appeal = {
      id: `appeal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reason,
      evidence: validatedEvidence.map(item => ({
        id: generateEvidenceId(),
        filename: item.filename,
        url: item.url,
        type: item.type || getMimeType(item.filename),
        uploadedBy: userId,
        uploadedAt: new Date(),
        verified: false,
        metadata: {
          size: item.size,
          originalName: item.originalName || item.filename,
          hash: item.hash || generateFileHash(item)
        }
      })),
      submittedBy: userId,
      submittedAt: new Date(),
      status: 'PENDING_REVIEW',
      reviewer: null,
      reviewedAt: null,
      decision: null,
      decisionReason: null
    };

    // Update dispute with appeal
    dispute.appeal = appeal;

    // Add to timeline
    dispute.timeline.push({
      status: dispute.status, // Keep current status
      timestamp: new Date(),
      note: `Appeal submitted by ${isClient ? 'client' : 'freelancer'}`,
      action: 'appeal_submitted',
      submittedBy: userId
    });

    await dispute.save();

    // Notify project participants
    const notifyProject = require('../socket/server').notifyProject;
    notifyProject(dispute.project.toString(), 'dispute-appeal-submitted', {
      disputeId: dispute._id,
      submittedBy: userId,
      message: `${isClient ? 'Client' : 'Freelancer'} submitted an appeal for resolved dispute`
    });

    res.status(201).json({
      message: 'Appeal submitted successfully',
      dispute
    });
  } catch (error) {
    next(error);
  }
};

// Review dispute appeal (admin/arbitrator only)
const reviewDisputeAppeal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { decision, decisionReason } = req.body; // decision: 'APPROVED' or 'REJECTED'

    const dispute = await Dispute.findById(id);
    if (!dispute || !dispute.appeal) {
      return next(new NotFoundError('Dispute or appeal not found'));
    }

    // Verify user is admin or arbitrator
    const user = await User.findById(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'arbitrator')) {
      return next(new ForbiddenError('Only admin or arbitrator can review appeals'));
    }

    // Validate decision
    const validDecisions = ['APPROVED', 'REJECTED'];
    if (!validDecisions.includes(decision)) {
      return next(new BadRequestError(`Invalid decision: ${decision}. Must be one of: ${validDecisions.join(', ')}`));
    }

    // Update appeal with review details
    dispute.appeal.status = decision;
    dispute.appeal.reviewer = userId;
    dispute.appeal.reviewedAt = new Date();
    dispute.appeal.decision = decision;
    dispute.appeal.decisionReason = decisionReason;

    if (decision === 'APPROVED') {
      // If appeal is approved, reset dispute to arbitration status
      dispute.status = 'IN_ARBITRATION';
      dispute.timeline.push({
        status: 'IN_ARBITRATION',
        timestamp: new Date(),
        note: 'Appeal approved, dispute returned to arbitration',
        action: 'appeal_approved'
      });
    } else {
      // If appeal is rejected, keep dispute as resolved
      dispute.timeline.push({
        status: 'RESOLVED', // Keep as resolved
        timestamp: new Date(),
        note: 'Appeal rejected, original resolution stands',
        action: 'appeal_rejected'
      });
    }

    await dispute.save();

    // Notify project participants
    const notifyProject = require('../socket/server').notifyProject;
    notifyProject(dispute.project.toString(), 'dispute-appeal-reviewed', {
      disputeId: dispute._id,
      decision,
      message: `Appeal has been ${decision === 'APPROVED' ? 'approved' : 'rejected'}`
    });

    res.json({
      message: `Appeal ${decision === 'APPROVED' ? 'approved' : 'rejected'} successfully`,
      dispute
    });
  } catch (error) {
    next(error);
  }
};

// Assign arbitrator to dispute
const assignArbitrator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { arbitratorId } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return next(new ForbiddenError('Only admins can assign arbitrators'));
    }

    // Verify the arbitrator exists and is registered as an arbitrator
    const arbitrator = await User.findById(arbitratorId);
    if (!arbitrator) {
      return next(new NotFoundError('Arbitrator not found'));
    }

    // Check if user has arbitrator role or is registered as an arbitrator
    if (arbitrator.role !== 'arbitrator' && !arbitrator.isArbitrator) {
      return next(new BadRequestError('User is not registered as an arbitrator'));
    }

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return next(new NotFoundError('Dispute not found'));
    }

    // Only assign to arbitration stage
    if (dispute.status !== 'IN_ARBITRATION') {
      // Move to arbitration if not already there
      dispute.status = 'IN_ARBITRATION';
      dispute.timeline.push({
        status: 'IN_ARBITRATION',
        timestamp: new Date(),
        note: 'Dispute moved to arbitration for arbitrator assignment',
        action: 'status_change'
      });
    }

    // Assign the arbitrator
    dispute.arbitrator = arbitratorId;

    // Add to timeline
    dispute.timeline.push({
      status: 'IN_ARBITRATION',
      timestamp: new Date(),
      note: `Arbitrator ${arbitrator.firstName} ${arbitrator.lastName} assigned by admin`,
      action: 'arbitrator_assigned',
      assignedBy: userId,
      arbitratorId: arbitratorId
    });

    await dispute.save();

    // Add to project activity log
    const project = await Project.findById(dispute.project);
    project.activityLog.push({
      action: 'ARBITRATOR_ASSIGNED',
      performedBy: userId,
      details: {
        disputeId: dispute._id,
        arbitratorId: arbitratorId,
        arbitratorName: `${arbitrator.firstName} ${arbitrator.lastName}`
      }
    });
    await project.save();

    // Notify project participants
    const notifyProject = require('../socket/server').notifyProject;
    notifyProject(dispute.project.toString(), 'arbitrator-assigned', {
      disputeId: dispute._id,
      arbitratorId,
      message: `Arbitrator ${arbitrator.firstName} ${arbitrator.lastName} has been assigned to your dispute`
    });

    res.json({
      message: 'Arbitrator assigned to dispute',
      dispute
    });
  } catch (error) {
    next(error);
  }
};

// Calculate dispute fee based on milestone amount
function calculateDisputeFee(milestoneAmountInCents) {
  // Fee structure: $25-50 based on milestone amount
  const amountInDollars = milestoneAmountInCents / 100;

  let feeAmount;
  if (amountInDollars < 500) {
    feeAmount = 2500; // $25 in cents
  } else if (amountInDollars < 2000) {
    feeAmount = 3500; // $35 in cents
  } else {
    feeAmount = 5000; // $50 in cents
  }

  return {
    client: feeAmount,
    freelancer: feeAmount,
    total: feeAmount * 2 // Both parties pay equal fees
  };
}

// Process dispute fee payment
const processDisputeFee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { paymentMethodId } = req.body;

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return next(new NotFoundError('Dispute not found'));
    }

    // Verify user is the one who raised the dispute
    if (dispute.raisedBy.toString() !== userId) {
      return next(new ForbiddenError('Only dispute raiser can pay fee'));
    }

    // Check if user is client or freelancer to determine which fee to pay
    const project = await Project.findById(dispute.project);
    const isClient = project.client.toString() === userId;
    const isFreelancer = project.freelancer && project.freelancer.toString() === userId;

    if (!isClient && !isFreelancer) {
      return next(new ForbiddenError('User not part of this project'));
    }

    // Process payment using Stripe
    const stripeService = require('../services/paymentService');
    const feeAmount = isClient
      ? dispute.disputeFee.clientFee
      : dispute.disputeFee.freelancerFee;

    try {
      // Charge the user for their portion of the dispute fee
      const paymentIntent = await stripeService.createDisputeFeePayment(
        feeAmount,
        userId,
        `Dispute fee for milestone: ${dispute.milestone}`
      );

      // Update dispute fee status
      const updatedDisputeFee = { ...dispute.disputeFee };
      if (isClient) {
        updatedDisputeFee.clientFeePaid = true;
        updatedDisputeFee.clientPaymentId = paymentIntent.id;
      } else {
        updatedDisputeFee.freelancerFeePaid = true;
        updatedDisputeFee.freelancerPaymentId = paymentIntent.id;
      }

      // Check if both fees are paid to move to next status
      const bothFeesPaid = updatedDisputeFee.clientFeePaid && updatedDisputeFee.freelancerFeePaid;
      const newStatus = bothFeesPaid ? 'PENDING_REVIEW' : 'PENDING_FEE';

      dispute.disputeFee = updatedDisputeFee;
      dispute.status = newStatus;

      // Add to timeline if status changed
      if (bothFeesPaid) {
        dispute.timeline.push({
          status: 'PENDING_REVIEW',
          timestamp: new Date(),
          note: 'Both dispute fees paid, awaiting initial review'
        });
      }

      await dispute.save();

      // If both fees are paid, start the dispute resolution process
      if (bothFeesPaid) {
        await startDisputeResolutionProcess(dispute._id);
      }

      res.json({
        message: `Dispute fee payment ${bothFeesPaid ? 'completed and dispute review started' : 'initiated'}`,
        dispute,
        paymentIntent
      });
    } catch (paymentError) {
      console.error('Dispute fee payment error:', paymentError);
      return next(new BadRequestError(`Payment failed: ${paymentError.message}`));
    }
  } catch (error) {
    next(error);
  }
};

// Start dispute resolution process after fees are paid
async function startDisputeResolutionProcess(disputeId) {
  try {
    const dispute = await Dispute.findById(disputeId);
    const project = await Project.findById(dispute.project);
    const milestone = await Milestone.findById(dispute.milestone);

    // Process with AI for initial analysis
    try {
      const aiAnalysis = await processAIAnalysis({
        projectAgreement: project.description,
        disputeDescription: dispute.reason,
        milestoneDetails: milestone.toObject(),
        evidence: dispute.evidence ? dispute.evidence.map(e => e.url || e.filename).join(', ') : ''
      });

      dispute.aiAnalysis = aiAnalysis;

      // Determine next status based on AI confidence
      if (aiAnalysis.confidenceScore &&
          (aiAnalysis.confidenceScore.freelancer > 80 || aiAnalysis.confidenceScore.client > 80)) {
        // High confidence case - move to self-resolution
        dispute.status = 'SELF_RESOLUTION';
        dispute.timeline.push({
          status: 'SELF_RESOLUTION',
          timestamp: new Date(),
          note: 'AI analysis complete, moving to self-resolution phase'
        });
      } else {
        // Lower confidence - move to mediation
        dispute.status = 'IN_MEDIATION';
        dispute.timeline.push({
          status: 'IN_MEDIATION',
          timestamp: new Date(),
          note: 'Moving to mediation phase'
        });
      }

      await dispute.save();
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      // Continue with mediation if AI fails
      dispute.status = 'IN_MEDIATION';
      dispute.timeline.push({
        status: 'IN_MEDIATION',
        timestamp: new Date(),
        note: 'AI analysis failed, moving to mediation phase'
      });
      await dispute.save();
    }

    // Notify project participants
    const notifyProject = require('../socket/server').notifyProject;
    notifyProject(dispute.project.toString(), 'dispute-status-change', {
      disputeId: dispute._id,
      newStatus: dispute.status,
      message: `Dispute status changed to ${dispute.status.replace('_', ' ')}`
    });
  } catch (error) {
    console.error('Error in dispute resolution process:', error);
  }
}

// Add a message to a dispute
const addDisputeMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return next(new NotFoundError('Dispute not found'));
    }

    // Verify user is part of the dispute
    const project = await Project.findById(dispute.project);
    if (!project || (project.client.toString() !== userId && project.freelancer.toString() !== userId)) {
      return next(new ForbiddenError('Not authorized to participate in this dispute'));
    }

    // Add message
    if (!dispute.messages) {
      dispute.messages = [];
    }
    
    dispute.messages.push({
      sender: userId,
      content,
      sentAt: new Date()
    });

    await dispute.save();

    // Notify project participants
    notifyProject(dispute.project.toString(), 'dispute-message', {
      disputeId: dispute._id,
      message: {
        sender: userId,
        content,
        sentAt: new Date()
      }
    });

    res.status(201).json({
      message: 'Message added to dispute',
      messageObj: {
        sender: userId,
        content,
        sentAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Move dispute to mediation (admin/arbitrator only)
const moveToMediation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'arbitrator')) {
      return next(new ForbiddenError('Only admins and arbitrators can move disputes to mediation'));
    }

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return next(new NotFoundError('Dispute not found'));
    }

    if (dispute.status !== 'PENDING_REVIEW' && dispute.status !== 'IN_MEDIATION') {
      return next(new BadRequestError('Dispute cannot be moved to mediation from current status'));
    }

    // Update dispute status
    dispute.status = 'IN_MEDIATION';
    dispute.resolutionPhase = 'MEDIATION';
    dispute.mediator = userId;
    await dispute.save();

    // Add to project activity log
    const project = await Project.findById(dispute.project);
    project.activityLog.push({
      action: 'DISPUTE_MOVED_TO_MEDIATION',
      performedBy: userId,
      details: {
        disputeId: dispute._id,
        mediator: userId
      }
    });
    await project.save();

    res.json({
      message: 'Dispute moved to mediation',
      dispute
    });
  } catch (error) {
    next(error);
  }
};

// Assign arbitrator to dispute (admin only)
const assignArbitrator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { arbitratorId } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return next(new ForbiddenError('Only admins can assign arbitrators'));
    }

    // Verify the arbitrator exists and is registered as an arbitrator
    const arbitrator = await User.findById(arbitratorId);
    if (!arbitrator) {
      return next(new NotFoundError('Arbitrator not found'));
    }

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return next(new NotFoundError('Dispute not found'));
    }

    if (dispute.status !== 'IN_ARBITRATION') {
      // Move to arbitration first if needed
      dispute.status = 'IN_ARBITRATION';
      dispute.resolutionPhase = 'ARBITRATION';
    }
    
    // Assign the arbitrator
    dispute.arbitrator = arbitratorId;
    await dispute.save();

    // Add to project activity log
    const project = await Project.findById(dispute.project);
    project.activityLog.push({
      action: 'ARBITRATOR_ASSIGNED',
      performedBy: userId,
      details: {
        disputeId: dispute._id,
        arbitratorId: arbitratorId
      }
    });
    await project.save();

    res.json({
      message: 'Arbitrator assigned to dispute',
      dispute
    });
  } catch (error) {
    next(error);
  }
};

// Resolve dispute (by arbitrator)
const resolveDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, amountToFreelancer, amountToClient, decisionReason } = req.body;
    const userId = req.user.userId;

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return next(new NotFoundError('Dispute not found'));
    }

    // Verify user is the assigned arbitrator, or an admin if no arbitrator assigned
    if (dispute.arbitrator && dispute.arbitrator.toString() !== userId) {
      const user = await User.findById(userId);
      if (!user || user.role !== 'admin') {
        return next(new ForbiddenError('Only assigned arbitrator or admin can resolve this dispute'));
      }
    }

    // Verify the amounts match the milestone amount (for partial payments)
    const project = await Project.findById(dispute.project);
    const milestone = await Milestone.findById(dispute.milestone);

    const currency = milestone.currency || project.currency || 'USD';
    // Get the milestone amount in the project's currency units
    const milestoneAmountInCurrencyUnits = milestone.amount;

    // Validate that the total amount to be distributed equals the milestone amount
    // Convert amounts back to currency units for comparison
    let amountToFreelancerInCurrencyUnits, amountToClientInCurrencyUnits;
    switch (currency.toUpperCase()) {
      case 'JPY':
        // JPY has no decimal places
        amountToFreelancerInCurrencyUnits = Math.round(amountToFreelancer);
        amountToClientInCurrencyUnits = Math.round(amountToClient);
        break;
      case 'BTC':
        // BTC uses 8 decimal places (satoshi)
        amountToFreelancerInCurrencyUnits = Math.round(amountToFreelancer * 100000000);
        amountToClientInCurrencyUnits = Math.round(amountToClient * 100000000);
        break;
      case 'ETH':
        // ETH uses 18 decimal places (wei)
        amountToFreelancerInCurrencyUnits = Math.round(amountToFreelancer * 1000000000000000000);
        amountToClientInCurrencyUnits = Math.round(amountToClient * 1000000000000000000);
        break;
      default:
        // For most currencies including USD, EUR, GBP, etc., use 2 decimal places
        amountToFreelancerInCurrencyUnits = Math.round(amountToFreelancer * 100);
        amountToClientInCurrencyUnits = Math.round(amountToClient * 100);
        break;
    }

    if (decision !== 'revision_required' &&
        Math.abs(amountToFreelancerInCurrencyUnits + amountToClientInCurrencyUnits - milestoneAmountInCurrencyUnits) > 0.01) {
      return next(new BadRequestError('Amounts must add up to the milestone amount in the project currency'));
    }

    // Process the resolution
    dispute.resolution = {
      decision,
      amountToFreelancer: amountToFreelancerInCurrencyUnits,
      amountToClient: amountToClientInCurrencyUnits,
      decisionReason,
      decidedBy: userId,
      decidedAt: new Date()
    };
    
    dispute.status = 'RESOLVED';
    await dispute.save();

    // Process payment release/refund if needed
    if (decision !== 'revision_required') {
      // Create transaction record for the resolution
      const transaction = new Transaction({
        projectId: dispute.project,
        disputeId: dispute._id,
        type: decision.includes('payment') ? 'DISPUTE_PAYMENT' : 'DISPUTE_REFUND',
        amount: decision.includes('payment') ? amountToFreelancerInCurrencyUnits : amountToClientInCurrencyUnits,
        from: decision.includes('payment') ? null : project.client, // From escrow if payment, from client if refund
        to: decision.includes('payment') ? project.freelancer : project.client,
        currency: currency,
        status: 'COMPLETED', // For now, mark as completed
        provider: 'stripe',
        providerTransactionId: `disp_${Date.now()}`,
        description: `Dispute resolution: ${decision}`,
        fees: {
          platform: 0, // No platform fee for dispute resolution
          paymentProcessor: 0,
          total: 0
        }
      });

      await transaction.save();

      // Update project escrow status based on resolution
      if (decision.includes('payment')) {
        project.escrow.totalReleased += amountToFreelancerInCurrencyUnits;
        project.escrow.remaining -= amountToFreelancerInCurrencyUnits;
      }
      if (decision === 'full_refund_to_client') {
        project.escrow.remaining = 0; // Clear remaining if full refund
      }

      // Handle the actual payment transfer/refund
      if (decision.includes('payment') && amountToFreelancer > 0) {
        try {
          // Convert amount back to base units for the transfer
          let amountInBaseUnits;
          switch (currency.toUpperCase()) {
            case 'JPY':
              // JPY has no decimal places
              amountInBaseUnits = amountToFreelancer;
              break;
            case 'BTC':
              // BTC uses 8 decimal places (satoshi)
              amountInBaseUnits = amountToFreelancer / 100000000;
              break;
            case 'ETH':
              // ETH uses 18 decimal places (wei)
              amountInBaseUnits = amountToFreelancer / 1000000000000000000;
              break;
            default:
              // For most currencies including USD, EUR, GBP, etc., use 2 decimal places
              amountInBaseUnits = amountToFreelancer / 100;
              break;
          }

          const freelancer = await User.findById(project.freelancer);
          if (freelancer && freelancer.stripeAccountId) {
            await stripeService.transferToFreelancer(
              amountInBaseUnits,
              freelancer.stripeAccountId,
              `Dispute resolution payment for milestone: ${milestone.title}`
            );
          }
        } catch (paymentError) {
          console.error('Dispute resolution payment error:', paymentError);
          transaction.status = 'FAILED';
          await transaction.save();
        }
      }

      if (decision === 'full_refund_to_client' && amountToClient > 0) {
        // In a real system, this would process a refund to the client
        // For now, we'll just note it in the transaction
      }

      // Update milestone status based on resolution
      if (decision !== 'revision_required') {
        milestone.status = decision.includes('payment') ? 'APPROVED' : 'REVISION_REQUESTED';
      }
    } else {
      // If revision is required, set milestone back to submitted for freelancer to update
      milestone.status = 'REVISION_REQUESTED';
    }

    await Promise.all([project.save(), milestone.save()]);

    // Add to project activity log
    project.activityLog.push({
      action: 'DISPUTE_RESOLVED',
      performedBy: userId,
      details: {
        disputeId: dispute._id,
        resolution: dispute.resolution
      }
    });
    await project.save();

    // If all milestones are completed (approved), mark project as completed
    const allMilestones = await Milestone.find({ project: project._id });
    const allMilestonesCompleted = allMilestones.every(m =>
      m.status === 'APPROVED' || m.status === 'DISPUTED' // Disputed milestones are resolved separately
    );

    if (allMilestonesCompleted) {
      project.status = 'COMPLETED';
      await project.save();
    }

    // Notify project participants
    notifyProject(project._id.toString(), 'dispute-resolved', {
      disputeId: dispute._id,
      decision,
      resolvedBy: userId,
      timestamp: new Date(),
      message: `Dispute for milestone "${milestone.title}" has been resolved`
    });

    res.json({
      message: 'Dispute resolved',
      dispute,
      transaction: decision !== 'revision_required' ? transaction : null
    });
  } catch (error) {
    next(error);
  }
};

// Evaluate dispute for escalation to arbitration
const evaluateForArbitration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Only admin, arbitrator, or mediator can evaluate escalation
    const user = await User.findById(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'arbitrator' && user.role !== 'mediator')) {
      return next(new ForbiddenError('Only admin, arbitrator, or mediator can evaluate dispute escalation'));
    }

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return next(new NotFoundError('Dispute not found'));
    }

    // Check if dispute should be escalated to arbitration
    let shouldEscalate = false;
    
    // Conditions for escalation
    if (dispute.status === 'IN_MEDIATION' && dispute.resolutionPhase === 'MEDIATION') {
      // If mediation has been ongoing for more than 24 hours without resolution, escalate
      const mediationStart = dispute.mediator && dispute.updatedAt;
      if (mediationStart && (Date.now() - new Date(mediationStart).getTime()) > 24 * 60 * 60 * 1000) {
        shouldEscalate = true;
      }
      
      // If parties cannot reach agreement after multiple mediation messages, escalate
      if (dispute.messages && dispute.messages.length > 10) {
        shouldEscalate = true;
      }
    }

    if (shouldEscalate) {
      dispute.status = 'IN_ARBITRATION';
      dispute.resolutionPhase = 'ARBITRATION';
      await dispute.save();
    }

    res.json({
      message: 'Escalation evaluation completed',
      shouldEscalate,
      dispute
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserDisputes,
  getDispute,
  createDispute,
  processDisputeFee,
  submitDisputeEvidence,
  submitDisputeAppeal,
  reviewDisputeAppeal,
  addDisputeMessage,
  moveToMediation,
  assignArbitrator,
  resolveDispute,
  evaluateForArbitration
};