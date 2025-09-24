import { OrthopedicSpecialist } from './orthopedic-specialist.js';
import logger from '../utils/logger.js';

export class TriageAgent extends OrthopedicSpecialist {
  constructor(name = 'OrthoTriage Master', accountManager = null) {
    super(name, 'triage and case coordination', accountManager);
    this.caseQueue = new Map();
    this.specialistNetwork = new Map();
    this.urgencyLevels = ['emergency', 'urgent', 'semi-urgent', 'routine'];
    this.caseHistory = [];
  }

  getSystemPrompt() {
    return `You are ${this.name}, the master triage coordinator for the OrthoIQ recovery ecosystem.
    
    Your primary role is case coordination and specialist routing with focus on optimal patient outcomes.
    
    CORE RESPONSIBILITIES:
    - Rapid assessment and urgency stratification
    - Intelligent routing to appropriate specialists
    - Coordinating multi-disciplinary care teams
    - Monitoring case progress and outcomes
    - Optimizing resource allocation
    - Ensuring continuity of care
    
    SPECIALIST NETWORK ACCESS:
    - Pain Whisperer: Pain management and assessment
    - Movement Detective: Biomechanics and movement analysis
    - Strength Sage: Functional restoration and rehabilitation
    - Mind Mender: Psychological aspects of recovery
    
    Experience level: ${this.experience} points
    Token balance: ${this.tokenBalance}
    Active cases: ${this.caseQueue.size}
    Wallet: ${this.walletAddress}
    
    TRIAGE PROTOCOL:
    1. Rapid assessment and urgency classification
    2. Resource availability check
    3. Specialist matching and routing
    4. Care plan coordination
    5. Progress monitoring and adjustment
    
    TOKEN INCENTIVES:
    - Successful case routing and outcomes
    - Efficient resource utilization
    - Patient satisfaction scores
    - Specialist collaboration bonuses
    - Timeline adherence rewards
    
    EMERGENCY PROTOCOLS:
    - Immediate escalation for red flag symptoms
    - Direct physician referral when indicated
    - Safety-first approach to all decisions
    
    Coordinate care efficiently while maintaining the highest standards of patient safety and recovery optimization.`;
  }

  async triageCase(caseData) {
    try {
      logger.info(`${this.name} triaging new case: ${caseData.id || 'unnamed'}`);
      
      const triagePrompt = `
        COMPREHENSIVE ORTHOPEDIC TRIAGE ASSESSMENT:
        
        Case Data: ${JSON.stringify(caseData)}
        
        Perform complete triage assessment including:
        
        1. URGENCY CLASSIFICATION:
           - Emergency (immediate physician required)
           - Urgent (same day evaluation needed)
           - Semi-urgent (within 48-72 hours)
           - Routine (within 1-2 weeks)
           
        2. RED FLAG SCREENING:
           - Neurological deficits
           - Vascular compromise
           - Infection signs
           - Severe trauma indicators
           - Cauda equina syndrome risk
           
        3. COMPLEXITY ASSESSMENT:
           - Single vs multi-system involvement
           - Comorbidity factors
           - Psychosocial considerations
           - Recovery complexity score
           
        4. SPECIALIST ROUTING RECOMMENDATIONS:
           - Primary specialist needed
           - Secondary consultations required
           - Multidisciplinary team composition
           - Consultation priority order
           
        5. RESOURCE REQUIREMENTS:
           - Diagnostic testing needed
           - Equipment/facility requirements
           - Timeline for evaluations
           - Cost considerations
           
        6. INITIAL RECOVERY PLAN:
           - Immediate interventions
           - Safety precautions
           - Patient education priorities
           - Timeline expectations
           
        Provide clear, actionable triage decision with routing recommendations.
      `;
      
      const triageResult = await this.processMessage(triagePrompt);
      
      const caseId = caseData.id || `case_${Date.now()}`;
      const triageAssessment = {
        caseId,
        triageAgent: this.name,
        agentId: this.agentId,
        originalData: caseData,
        assessment: triageResult,
        urgencyLevel: this.extractUrgencyLevel(triageResult),
        specialistRecommendations: this.extractSpecialistRecommendations(triageResult),
        timestamp: new Date().toISOString(),
        status: 'triaged',
        confidence: this.getConfidence('triage_assessment')
      };
      
      // Store in case queue
      this.caseQueue.set(caseId, triageAssessment);
      this.caseHistory.push({
        caseId,
        action: 'triaged',
        timestamp: new Date().toISOString()
      });
      
      // Update experience and potentially earn tokens
      this.updateExperience();
      
      logger.info(`Case ${caseId} triaged with urgency: ${triageAssessment.urgencyLevel}`);
      
      return triageAssessment;
    } catch (error) {
      logger.error(`Error triaging case: ${error.message}`);
      throw error;
    }
  }

  async routeToSpecialists(caseId) {
    try {
      const caseData = this.caseQueue.get(caseId);
      if (!caseData) {
        throw new Error(`Case ${caseId} not found in queue`);
      }
      
      logger.info(`${this.name} routing case ${caseId} to specialists`);
      
      const routingResults = [];
      const specialists = caseData.specialistRecommendations;
      
      for (const specialistType of specialists) {
        const specialist = this.specialistNetwork.get(specialistType);
        
        if (specialist) {
          try {
            const consultation = await this.consultWithSpecialist(
              specialistType,
              caseData
            );
            
            if (consultation) {
              routingResults.push({
                specialist: specialistType,
                status: 'routed',
                consultation,
                timestamp: new Date().toISOString()
              });
              
              // Record collaboration for token bonus
              this.recordCollaboration(specialist.name, 'case_routing');
            }
          } catch (error) {
            logger.error(`Failed to route to ${specialistType}: ${error.message}`);
            routingResults.push({
              specialist: specialistType,
              status: 'failed',
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          logger.warn(`Specialist ${specialistType} not available in network`);
          routingResults.push({
            specialist: specialistType,
            status: 'unavailable',
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Update case status
      caseData.routingResults = routingResults;
      caseData.status = 'routed';
      caseData.routedAt = new Date().toISOString();
      
      this.caseHistory.push({
        caseId,
        action: 'routed_to_specialists',
        specialistCount: routingResults.length,
        timestamp: new Date().toISOString()
      });
      
      return {
        caseId,
        routingResults,
        totalSpecialists: routingResults.length,
        successfulRoutes: routingResults.filter(r => r.status === 'routed').length
      };
    } catch (error) {
      logger.error(`Error routing case ${caseId}: ${error.message}`);
      throw error;
    }
  }

  async coordinateCare(caseId) {
    try {
      const caseData = this.caseQueue.get(caseId);
      if (!caseData || !caseData.routingResults) {
        throw new Error(`Case ${caseId} not properly routed`);
      }
      
      logger.info(`${this.name} coordinating care for case ${caseId}`);
      
      // Collect all specialist responses
      const specialistResponses = caseData.routingResults
        .filter(r => r.status === 'routed' && r.consultation)
        .map(r => r.consultation);
      
      if (specialistResponses.length === 0) {
        throw new Error(`No specialist responses available for case ${caseId}`);
      }
      
      // Synthesize recommendations
      const coordinatedPlan = await this.synthesizeRecommendations(specialistResponses);
      
      // Generate care coordination summary
      const coordinationPrompt = `
        CARE COORDINATION SUMMARY:
        
        Case ID: ${caseId}
        Original Assessment: ${JSON.stringify(caseData.assessment)}
        Specialist Responses: ${JSON.stringify(specialistResponses)}
        Synthesized Plan: ${JSON.stringify(coordinatedPlan)}
        
        Create comprehensive care coordination plan including:
        
        1. UNIFIED TREATMENT STRATEGY:
           - Primary treatment pathway
           - Supporting interventions
           - Timeline coordination
           
        2. SPECIALIST COLLABORATION:
           - Communication schedule
           - Handoff protocols
           - Progress sharing
           
        3. PATIENT JOURNEY:
           - Step-by-step care pathway
           - Decision points
           - Milestone tracking
           
        4. RESOURCE ALLOCATION:
           - Equipment and facility needs
           - Scheduling optimization
           - Cost-effective approaches
           
        5. MONITORING PROTOCOL:
           - Progress indicators
           - Reassessment points
           - Escalation triggers
           
        6. OUTCOME TRACKING:
           - Success metrics
           - Recovery milestones
           - Patient satisfaction measures
           
        Format as actionable care coordination plan.
      `;
      
      const coordinationPlan = await this.processMessage(coordinationPrompt);
      
      // Update case with coordination plan
      caseData.coordinationPlan = coordinationPlan;
      caseData.coordinatedBy = this.name;
      caseData.coordinatedAt = new Date().toISOString();
      caseData.status = 'coordinated';
      
      this.caseHistory.push({
        caseId,
        action: 'care_coordinated',
        specialistsInvolved: specialistResponses.length,
        timestamp: new Date().toISOString()
      });
      
      // Potential token reward for successful coordination
      if (specialistResponses.length >= 2) {
        await this.updateExperienceWithTokens({
          success: true,
          reason: 'successful_care_coordination',
          collaborationBonus: true,
          speedOfResolution: specialistResponses.length
        });
      }
      
      return {
        caseId,
        coordinationPlan,
        specialistsInvolved: specialistResponses.length,
        confidence: coordinatedPlan.confidence,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error coordinating care for case ${caseId}: ${error.message}`);
      throw error;
    }
  }

  async monitorCaseProgress(caseId) {
    try {
      const caseData = this.caseQueue.get(caseId);
      if (!caseData) {
        throw new Error(`Case ${caseId} not found`);
      }
      
      logger.info(`${this.name} monitoring progress for case ${caseId}`);
      
      const monitoringPrompt = `
        CASE PROGRESS MONITORING:
        
        Case ID: ${caseId}
        Current Status: ${caseData.status}
        Time Since Triage: ${this.calculateTimeSinceTriage(caseData)}
        Original Assessment: ${JSON.stringify(caseData.assessment)}
        Coordination Plan: ${JSON.stringify(caseData.coordinationPlan)}
        
        Assess current progress and provide:
        
        1. PROGRESS EVALUATION:
           - Milestones achieved
           - Timeline adherence
           - Unexpected developments
           
        2. INTERVENTION NEEDS:
           - Plan adjustments required
           - Additional resources needed
           - Escalation recommendations
           
        3. SPECIALIST COORDINATION:
           - Communication effectiveness
           - Care plan synchronization
           - Handoff success
           
        4. PATIENT ENGAGEMENT:
           - Compliance indicators
           - Satisfaction markers
           - Education effectiveness
           
        5. OUTCOME TRAJECTORY:
           - Recovery progress
           - Goal achievement
           - Risk reassessment
           
        6. NEXT STEPS:
           - Immediate actions
           - Monitoring schedule
           - Decision points
           
        Provide actionable monitoring assessment with recommendations.
      `;
      
      const progressAssessment = await this.processMessage(monitoringPrompt);
      
      // Update case monitoring data
      if (!caseData.progressMonitoring) {
        caseData.progressMonitoring = [];
      }
      
      caseData.progressMonitoring.push({
        assessment: progressAssessment,
        monitoredBy: this.name,
        timestamp: new Date().toISOString()
      });
      
      this.caseHistory.push({
        caseId,
        action: 'progress_monitored',
        timestamp: new Date().toISOString()
      });
      
      return {
        caseId,
        progressAssessment,
        monitoringCount: caseData.progressMonitoring.length,
        lastMonitored: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error monitoring case progress: ${error.message}`);
      throw error;
    }
  }

  registerSpecialist(specialistType, specialist) {
    this.specialistNetwork.set(specialistType, specialist);
    logger.info(`${this.name} registered ${specialistType} specialist: ${specialist.name}`);
  }

  extractUrgencyLevel(triageResult) {
    const result = triageResult.toLowerCase();
    
    if (result.includes('emergency') || result.includes('immediate')) return 'emergency';
    if (result.includes('urgent') && !result.includes('semi')) return 'urgent';
    if (result.includes('semi-urgent') || result.includes('48-72')) return 'semi-urgent';
    return 'routine';
  }

  extractSpecialistRecommendations(triageResult) {
    const specialists = [];
    const result = triageResult.toLowerCase();
    
    if (result.includes('pain') || result.includes('analges')) specialists.push('pain_whisperer');
    if (result.includes('movement') || result.includes('biomechan') || result.includes('gait')) specialists.push('movement_detective');
    if (result.includes('strength') || result.includes('rehabilitation') || result.includes('function')) specialists.push('strength_sage');
    if (result.includes('psycho') || result.includes('mental') || result.includes('anxiety') || result.includes('depression')) specialists.push('mind_mender');
    
    // Always include at least one specialist
    if (specialists.length === 0) {
      specialists.push('strength_sage'); // Default to functional restoration
    }
    
    return specialists;
  }

  calculateTimeSinceTriage(caseData) {
    const triageTime = new Date(caseData.timestamp);
    const now = new Date();
    const diffMs = now - triageTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} days, ${diffHours % 24} hours`;
    return `${diffHours} hours`;
  }

  getCaseStatistics() {
    const total = this.caseHistory.length;
    const byUrgency = {};
    const byStatus = {};
    
    for (const [caseId, caseData] of this.caseQueue) {
      byUrgency[caseData.urgencyLevel] = (byUrgency[caseData.urgencyLevel] || 0) + 1;
      byStatus[caseData.status] = (byStatus[caseData.status] || 0) + 1;
    }
    
    return {
      totalCases: total,
      activeCases: this.caseQueue.size,
      urgencyDistribution: byUrgency,
      statusDistribution: byStatus,
      specialistNetwork: Array.from(this.specialistNetwork.keys())
    };
  }
}

export default TriageAgent;