import logger from './logger.js';
import { agentConfig } from '../config/agent-config.js';

export class AgentCoordinator {
  constructor() {
    this.specialists = new Map();
    this.activeConsultations = new Map();
    this.coordinationHistory = [];
    this.performanceMetrics = new Map();
  }

  registerSpecialist(type, agent) {
    this.specialists.set(type, agent);
    
    // Initialize performance tracking
    this.performanceMetrics.set(type, {
      consultations: 0,
      successRate: 0,
      averageResponseTime: 0,
      patientSatisfaction: 0,
      tokenBalance: agent.tokenBalance,
      experience: agent.experience
    });
    
    logger.info(`AgentCoordinator: Registered ${type} specialist - ${agent.name}`);
  }

  async coordinateMultiSpecialistConsultation(caseData, requiredSpecialists = []) {
    try {
      const consultationId = `consultation_${Date.now()}`;
      logger.info(`Starting multi-specialist consultation: ${consultationId}`);
      
      // Validate required specialists are available
      const availableSpecialists = this.validateSpecialistAvailability(requiredSpecialists);
      
      if (availableSpecialists.length === 0) {
        throw new Error('No required specialists available for consultation');
      }
      
      // Create consultation session
      const consultation = {
        id: consultationId,
        caseData,
        requiredSpecialists,
        availableSpecialists,
        responses: new Map(),
        startTime: new Date().toISOString(),
        status: 'in_progress'
      };
      
      this.activeConsultations.set(consultationId, consultation);
      
      // Collect responses from all available specialists
      const responses = await this.collectSpecialistResponses(consultation);
      
      // Synthesize recommendations
      const synthesizedRecommendations = await this.synthesizeRecommendations(responses, caseData);
      
      // Update consultation
      consultation.responses = responses;
      consultation.synthesizedRecommendations = synthesizedRecommendations;
      consultation.endTime = new Date().toISOString();
      consultation.status = 'completed';
      
      // Update performance metrics
      this.updatePerformanceMetrics(consultation);
      
      // Store in history
      this.coordinationHistory.push({
        consultationId,
        caseType: caseData.type || 'unknown',
        specialistsInvolved: availableSpecialists,
        duration: this.calculateDuration(consultation.startTime, consultation.endTime),
        success: true,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`Completed multi-specialist consultation: ${consultationId}`);
      
      return {
        consultationId,
        synthesizedRecommendations,
        participatingSpecialists: availableSpecialists,
        responses: Array.from(responses.values()),
        coordinationSummary: this.generateCoordinationSummary(consultation)
      };
    } catch (error) {
      logger.error(`Error in multi-specialist consultation: ${error.message}`);
      throw error;
    }
  }

  async routeCaseToAppropriateSpecialists(caseData) {
    try {
      logger.info('Routing case to appropriate specialists');
      
      // Analyze case to determine required specialists
      const specialistRecommendations = await this.analyzeSpecialistNeeds(caseData);
      
      // Validate specialist availability and capacity
      const routingPlan = this.createRoutingPlan(specialistRecommendations);
      
      // Execute routing
      const routingResults = await this.executeRouting(caseData, routingPlan);
      
      return {
        caseId: caseData.id || `case_${Date.now()}`,
        specialistRecommendations,
        routingPlan,
        routingResults,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error routing case: ${error.message}`);
      throw error;
    }
  }

  async manageSpecialistWorkload() {
    try {
      logger.info('Managing specialist workload distribution');
      
      const workloadAnalysis = new Map();
      
      for (const [type, specialist] of this.specialists) {
        const metrics = this.performanceMetrics.get(type);
        const currentLoad = await this.assessSpecialistLoad(specialist);
        
        workloadAnalysis.set(type, {
          currentLoad,
          capacity: this.calculateCapacity(specialist),
          efficiency: metrics.successRate,
          availability: this.assessAvailability(currentLoad)
        });
      }
      
      // Identify load balancing opportunities
      const recommendations = this.generateLoadBalancingRecommendations(workloadAnalysis);
      
      return {
        workloadAnalysis: Object.fromEntries(workloadAnalysis),
        recommendations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error managing specialist workload: ${error.message}`);
      throw error;
    }
  }

  validateSpecialistAvailability(requiredSpecialists) {
    const available = [];
    
    for (const specialistType of requiredSpecialists) {
      if (this.specialists.has(specialistType)) {
        const specialist = this.specialists.get(specialistType);
        const metrics = this.performanceMetrics.get(specialistType);
        
        // Check if specialist is available based on current load
        if (this.isSpecialistAvailable(specialist, metrics)) {
          available.push(specialistType);
        }
      }
    }
    
    return available;
  }

  async collectSpecialistResponses(consultation) {
    const responses = new Map();
    const responsePromises = [];
    
    for (const specialistType of consultation.availableSpecialists) {
      const specialist = this.specialists.get(specialistType);
      
      const responsePromise = this.getSpecialistResponse(
        specialist,
        consultation.caseData,
        consultation.id
      ).then(response => {
        responses.set(specialistType, response);
        
        // Update consultation performance metrics
        this.recordSpecialistPerformance(specialistType, response);
      }).catch(error => {
        logger.error(`Error getting response from ${specialistType}: ${error.message}`);
        responses.set(specialistType, {
          error: error.message,
          status: 'failed',
          timestamp: new Date().toISOString()
        });
      });
      
      responsePromises.push(responsePromise);
    }
    
    // Wait for all responses (with timeout)
    await Promise.allSettled(responsePromises);
    
    return responses;
  }

  async getSpecialistResponse(specialist, caseData, consultationId) {
    const startTime = Date.now();
    
    try {
      let response;
      
      // Route to appropriate specialist method based on type
      if (specialist.analyzeSymptoms) {
        response = await specialist.analyzeSymptoms(caseData.symptoms, caseData.history);
      } else if (specialist.triageCase) {
        response = await specialist.triageCase(caseData);
      } else if (specialist.assessPain) {
        response = await specialist.assessPain(caseData.painData || caseData);
      } else if (specialist.analyzeMovementPattern) {
        response = await specialist.analyzeMovementPattern(caseData.movementData || caseData);
      } else if (specialist.assessFunctionalCapacity) {
        response = await specialist.assessFunctionalCapacity(caseData.functionalData || caseData);
      } else if (specialist.assessPsychologicalFactors) {
        response = await specialist.assessPsychologicalFactors(caseData.psychData || caseData);
      } else {
        // Fallback to general processing
        response = await specialist.processMessage(
          `Please analyze this case: ${JSON.stringify(caseData)}`,
          { consultationId, type: 'multi_specialist_consultation' }
        );
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        specialist: specialist.name,
        response,
        responseTime,
        confidence: specialist.getConfidence('consultation'),
        timestamp: new Date().toISOString(),
        status: 'success'
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        specialist: specialist.name,
        error: error.message,
        responseTime,
        timestamp: new Date().toISOString(),
        status: 'failed'
      };
    }
  }

  async synthesizeRecommendations(responses, caseData) {
    try {
      const successfulResponses = Array.from(responses.values())
        .filter(r => r.status === 'success');
      
      if (successfulResponses.length === 0) {
        throw new Error('No successful specialist responses to synthesize');
      }
      
      // Create synthesis prompt
      const synthesisPrompt = `
        MULTI-SPECIALIST CONSULTATION SYNTHESIS:
        
        Case Data: ${JSON.stringify(caseData)}
        
        Specialist Responses:
        ${successfulResponses.map((r, i) => `
        ${i + 1}. ${r.specialist} (Confidence: ${r.confidence}):
        ${JSON.stringify(r.response)}
        `).join('\n')}
        
        Synthesize these specialist recommendations into a unified treatment plan:
        
        1. UNIFIED ASSESSMENT:
           - Consensus findings across specialists
           - Areas of agreement and disagreement
           - Prioritized problem list
           - Risk stratification
        
        2. INTEGRATED TREATMENT PLAN:
           - Primary treatment pathway
           - Coordinated interventions
           - Timeline and sequencing
           - Specialist role definitions
        
        3. CARE COORDINATION:
           - Communication protocols
           - Handoff procedures
           - Progress monitoring plan
           - Decision points and escalation
        
        4. PATIENT-CENTERED APPROACH:
           - Unified patient education
           - Coordinated goal setting
           - Adherence optimization
           - Quality of life focus
        
        5. OUTCOME OPTIMIZATION:
           - Success metrics
           - Recovery milestones
           - Risk mitigation
           - Long-term planning
        
        Provide comprehensive, actionable synthesis that leverages all specialist expertise.
      `;
      
      // Use the triage agent for synthesis if available, otherwise use first available specialist
      let synthesizer = this.specialists.get('triage') || this.specialists.get('orthopedic_specialist');
      if (!synthesizer) {
        synthesizer = successfulResponses[0]; // Fallback
      }
      
      const synthesis = await synthesizer.processMessage(synthesisPrompt);
      
      return {
        synthesis,
        participatingSpecialists: successfulResponses.map(r => r.specialist),
        consensusLevel: this.calculateConsensusLevel(successfulResponses),
        synthesizedBy: synthesizer.name,
        confidence: this.calculateSynthesisConfidence(successfulResponses),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error synthesizing recommendations: ${error.message}`);
      throw error;
    }
  }

  async analyzeSpecialistNeeds(caseData) {
    const needs = [];
    
    // Rule-based specialist assignment
    if (caseData.symptoms || caseData.diagnosis) {
      needs.push('orthopedic_specialist');
    }
    
    if (caseData.painLevel > 6 || caseData.chronicPain) {
      needs.push('pain_whisperer');
    }
    
    if (caseData.movementDysfunction || caseData.gaitProblems) {
      needs.push('movement_detective');
    }
    
    if (caseData.functionalLimitations || caseData.strengthDeficits) {
      needs.push('strength_sage');
    }
    
    if (caseData.psychologicalFactors || caseData.anxietyLevel > 5) {
      needs.push('mind_mender');
    }
    
    // Always include triage for coordination
    if (!needs.includes('triage')) {
      needs.unshift('triage');
    }
    
    return needs;
  }

  createRoutingPlan(specialistRecommendations) {
    const plan = {
      primary: specialistRecommendations[0],
      secondary: specialistRecommendations.slice(1, 3),
      optional: specialistRecommendations.slice(3),
      sequence: this.determineSequence(specialistRecommendations),
      priority: 'urgent'
    };
    
    return plan;
  }

  async executeRouting(caseData, routingPlan) {
    const results = [];
    
    // Route to primary specialist first
    if (routingPlan.primary) {
      const primaryResult = await this.routeToSpecialist(
        routingPlan.primary,
        caseData,
        'primary'
      );
      results.push(primaryResult);
    }
    
    // Route to secondary specialists in parallel
    const secondaryPromises = routingPlan.secondary.map(type =>
      this.routeToSpecialist(type, caseData, 'secondary')
    );
    
    const secondaryResults = await Promise.allSettled(secondaryPromises);
    results.push(...secondaryResults.map(r => r.value || r.reason));
    
    return results;
  }

  async routeToSpecialist(specialistType, caseData, priority) {
    try {
      const specialist = this.specialists.get(specialistType);
      if (!specialist) {
        throw new Error(`Specialist ${specialistType} not available`);
      }
      
      const routing = await specialist.consultWithSpecialist(specialistType, caseData);
      
      return {
        specialistType,
        status: 'routed',
        priority,
        routing,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        specialistType,
        status: 'failed',
        priority,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  isSpecialistAvailable(specialist, metrics) {
    // Simple availability check - could be enhanced
    return metrics.consultations < agentConfig.agent.maxSpecialistsPerCase * 10;
  }

  async assessSpecialistLoad(specialist) {
    // Assess current workload - placeholder implementation
    return {
      activeConsultations: 0,
      queuedCases: 0,
      responseTime: 100,
      utilizationRate: 0.7
    };
  }

  calculateCapacity(specialist) {
    // Calculate specialist capacity based on experience and performance
    const baseCapacity = 10;
    const experienceMultiplier = Math.min(specialist.experience / 100, 2);
    const confidenceMultiplier = specialist.getConfidence('general') || 0.8;
    
    return Math.floor(baseCapacity * experienceMultiplier * confidenceMultiplier);
  }

  assessAvailability(currentLoad) {
    const utilizationRate = currentLoad.utilizationRate || 0;
    
    if (utilizationRate < 0.5) return 'high';
    if (utilizationRate < 0.8) return 'medium';
    return 'low';
  }

  generateLoadBalancingRecommendations(workloadAnalysis) {
    const recommendations = [];
    
    for (const [type, analysis] of workloadAnalysis) {
      if (analysis.availability === 'low') {
        recommendations.push({
          type: 'redistribute_load',
          specialist: type,
          reason: 'High utilization detected',
          action: 'Consider routing some cases to other available specialists'
        });
      }
      
      if (analysis.efficiency < 0.7) {
        recommendations.push({
          type: 'improve_efficiency',
          specialist: type,
          reason: 'Low success rate detected',
          action: 'Review cases and provide additional training or support'
        });
      }
    }
    
    return recommendations;
  }

  recordSpecialistPerformance(specialistType, response) {
    const metrics = this.performanceMetrics.get(specialistType);
    
    if (metrics) {
      metrics.consultations += 1;
      
      if (response.status === 'success') {
        metrics.successRate = (metrics.successRate * (metrics.consultations - 1) + 1) / metrics.consultations;
      } else {
        metrics.successRate = (metrics.successRate * (metrics.consultations - 1)) / metrics.consultations;
      }
      
      // Update average response time
      if (response.responseTime) {
        metrics.averageResponseTime = (
          (metrics.averageResponseTime * (metrics.consultations - 1)) + response.responseTime
        ) / metrics.consultations;
      }
    }
  }

  updatePerformanceMetrics(consultation) {
    for (const specialistType of consultation.availableSpecialists) {
      const response = consultation.responses.get(specialistType);
      if (response) {
        this.recordSpecialistPerformance(specialistType, response);
      }
    }
  }

  calculateDuration(startTime, endTime) {
    return new Date(endTime) - new Date(startTime);
  }

  generateCoordinationSummary(consultation) {
    const successfulResponses = Array.from(consultation.responses.values())
      .filter(r => r.status === 'success').length;
    
    const totalResponses = consultation.responses.size;
    const successRate = totalResponses > 0 ? (successfulResponses / totalResponses) * 100 : 0;
    
    return {
      totalSpecialists: totalResponses,
      successfulResponses,
      successRate: Math.round(successRate),
      duration: this.calculateDuration(consultation.startTime, consultation.endTime),
      qualityScore: this.calculateQualityScore(consultation)
    };
  }

  calculateConsensusLevel(responses) {
    // Simple consensus calculation - could be enhanced with NLP
    const recommendations = responses.map(r => r.response?.recommendations || '').join(' ');
    const commonTerms = this.extractCommonTerms(recommendations);
    
    return commonTerms.length > 3 ? 'high' : commonTerms.length > 1 ? 'medium' : 'low';
  }

  calculateSynthesisConfidence(responses) {
    const confidences = responses
      .filter(r => r.confidence)
      .map(r => r.confidence);
    
    if (confidences.length === 0) return 0.5;
    
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  determineSequence(specialists) {
    // Define optimal sequence for specialist consultations
    const priorityOrder = ['triage', 'orthopedic_specialist', 'pain_whisperer', 'movement_detective', 'strength_sage', 'mind_mender'];
    
    return specialists.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a);
      const bIndex = priorityOrder.indexOf(b);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
  }

  calculateQualityScore(consultation) {
    // Calculate overall quality score for the consultation
    let score = 0;
    
    const responses = Array.from(consultation.responses.values());
    const successRate = responses.filter(r => r.status === 'success').length / responses.length;
    
    score += successRate * 40; // 40% for success rate
    
    const avgConfidence = responses
      .filter(r => r.confidence)
      .reduce((sum, r) => sum + r.confidence, 0) / responses.length || 0.5;
    
    score += avgConfidence * 30; // 30% for confidence
    
    const avgResponseTime = responses
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / responses.length || 5000;
    
    const timeScore = Math.max(0, (10000 - avgResponseTime) / 10000);
    score += timeScore * 30; // 30% for response time
    
    return Math.round(score);
  }

  extractCommonTerms(text) {
    // Simple term extraction - could be enhanced
    const words = text.toLowerCase().split(/\W+/);
    const frequency = {};
    
    words.forEach(word => {
      if (word.length > 4) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });
    
    return Object.keys(frequency).filter(word => frequency[word] > 1);
  }

  getCoordinationStatistics() {
    const totalConsultations = this.coordinationHistory.length;
    const successful = this.coordinationHistory.filter(c => c.success).length;
    
    const specialistUsage = {};
    this.coordinationHistory.forEach(consultation => {
      consultation.specialistsInvolved.forEach(specialist => {
        specialistUsage[specialist] = (specialistUsage[specialist] || 0) + 1;
      });
    });
    
    return {
      totalConsultations,
      successRate: totalConsultations > 0 ? (successful / totalConsultations) * 100 : 0,
      averageDuration: this.coordinationHistory.reduce((sum, c) => sum + c.duration, 0) / totalConsultations || 0,
      specialistUsage,
      performanceMetrics: Object.fromEntries(this.performanceMetrics),
      activeConsultations: this.activeConsultations.size
    };
  }
}

export default AgentCoordinator;