import { OrthopedicSpecialist } from './orthopedic-specialist.js';
import logger from '../utils/logger.js';

export class PainWhispererAgent extends OrthopedicSpecialist {
  constructor(name = 'Pain Whisperer', accountManager = null) {
    super(name, 'pain management and assessment', accountManager);
    this.painScales = {
      numeric: { min: 0, max: 10 },
      functional: ['none', 'mild', 'moderate', 'severe', 'excruciating'],
      descriptive: ['burning', 'aching', 'sharp', 'throbbing', 'cramping', 'stabbing']
    };
    this.painInterventions = new Map();
    this.painTrackingHistory = [];
  }

  getSystemPrompt() {
    return `You are ${this.name}, the specialized pain management expert in the OrthoIQ recovery ecosystem.
    
    Your expertise encompasses comprehensive pain assessment, management, and recovery optimization through understanding the complex interplay of physical, psychological, and social factors affecting pain experience.
    
    CORE SPECIALIZATIONS:
    - Comprehensive pain assessment and phenotyping
    - Multi-modal pain management strategies
    - Acute to chronic pain transition prevention
    - Opioid-sparing approaches and alternatives
    - Interventional pain procedures guidance
    - Pain psychology and coping strategies
    - Functional restoration through pain management
    
    PAIN ASSESSMENT FRAMEWORK:
    - Intensity (0-10 scale, functional impact)
    - Quality (sharp, dull, burning, etc.)
    - Temporal patterns (constant, intermittent, positional)
    - Triggers and relieving factors
    - Functional impact on daily activities
    - Psychological impact and coping
    - Sleep and mood effects
    
    Experience level: ${this.experience} points
    Token balance: ${this.tokenBalance}
    Pain cases managed: ${this.painTrackingHistory.length}
    Wallet: ${this.walletAddress}
    
    EVIDENCE-BASED APPROACHES:
    - Multimodal analgesia protocols
    - Movement-based pain management
    - Cognitive-behavioral strategies
    - Mindfulness and relaxation techniques
    - Graded exposure and activity pacing
    - Social support optimization
    
    TOKEN INCENTIVES:
    - Pain reduction achievements (>50% improvement)
    - Functional improvement milestones
    - Opioid reduction success
    - Patient satisfaction with pain management
    - Collaboration with other specialists
    - Innovation in pain management approaches
    
    SAFETY PROTOCOLS:
    - Red flag symptom recognition
    - Medication safety and monitoring
    - Addiction risk assessment
    - Emergency pain situations
    - Appropriate escalation pathways
    
    Your goal is to minimize suffering while maximizing function and quality of life through comprehensive, compassionate, and evidence-based pain management.`;
  }

  async assessPain(painData) {
    try {
      logger.info(`${this.name} conducting comprehensive pain assessment`);
      
      const assessmentPrompt = `
        COMPREHENSIVE PAIN ASSESSMENT:
        
        Pain Data: ${JSON.stringify(painData)}
        
        Conduct thorough pain evaluation including:
        
        1. PAIN CHARACTERIZATION:
           - Intensity assessment (0-10 scale)
           - Quality descriptors (sharp, dull, burning, etc.)
           - Location and radiation patterns
           - Temporal characteristics (constant, intermittent)
           - Aggravating and relieving factors
           
        2. FUNCTIONAL IMPACT ANALYSIS:
           - Activities of daily living affected
           - Work/occupation limitations
           - Sleep quality and patterns
           - Recreational activity restrictions
           - Social interaction changes
           
        3. PAIN PHENOTYPING:
           - Nociceptive vs neuropathic components
           - Central sensitization indicators
           - Inflammatory markers
           - Psychosocial contributors
           
        4. PSYCHOLOGICAL ASSESSMENT:
           - Pain catastrophizing tendencies
           - Fear-avoidance behaviors
           - Mood and anxiety screening
           - Coping strategies evaluation
           - Social support assessment
           
        5. MEDICATION HISTORY:
           - Current analgesic regimen
           - Effectiveness and side effects
           - Opioid exposure and tolerance
           - Allergies and contraindications
           
        6. RISK STRATIFICATION:
           - Acute to chronic transition risk
           - Addiction potential assessment
           - Comorbidity considerations
           - Red flag symptoms
           
        7. FUNCTIONAL GOALS:
           - Patient-specific objectives
           - Activity return priorities
           - Quality of life targets
           - Pain reduction expectations
           
        Provide comprehensive assessment with evidence-based recommendations.
      `;
      
      const assessment = await this.processMessage(assessmentPrompt);
      
      const painAssessment = {
        assessmentId: `pain_${Date.now()}`,
        agent: this.name,
        agentId: this.agentId,
        patientData: painData,
        assessment,
        painScore: this.extractPainScore(assessment),
        functionalImpact: this.extractFunctionalImpact(assessment),
        riskLevel: this.extractRiskLevel(assessment),
        confidence: this.getConfidence('pain_assessment'),
        timestamp: new Date().toISOString()
      };
      
      // Store in tracking history
      this.painTrackingHistory.push(painAssessment);
      this.updateExperience();
      
      return painAssessment;
    } catch (error) {
      logger.error(`Error in pain assessment: ${error.message}`);
      throw error;
    }
  }

  async developPainManagementPlan(painAssessment) {
    try {
      logger.info(`${this.name} developing comprehensive pain management plan`);
      
      const planPrompt = `
        EVIDENCE-BASED PAIN MANAGEMENT PLAN:
        
        Pain Assessment: ${JSON.stringify(painAssessment)}
        
        Develop comprehensive, multimodal pain management strategy:
        
        1. PHARMACOLOGICAL INTERVENTIONS:
           - Primary analgesic recommendations
           - Adjuvant medications (anticonvulsants, antidepressants)
           - Topical agents and preparations
           - Opioid-sparing alternatives
           - Rescue medication protocols
           
        2. NON-PHARMACOLOGICAL APPROACHES:
           - Physical therapy and exercise prescription
           - Heat/cold therapy applications
           - TENS and electrical stimulation
           - Acupuncture and dry needling
           - Massage and manual therapy
           
        3. INTERVENTIONAL OPTIONS:
           - Injection therapy candidates
           - Nerve block considerations
           - Regenerative medicine options
           - Surgical intervention timing
           
        4. PSYCHOLOGICAL INTERVENTIONS:
           - Cognitive-behavioral therapy referrals
           - Mindfulness and meditation training
           - Stress management techniques
           - Sleep hygiene optimization
           - Relaxation training
           
        5. LIFESTYLE MODIFICATIONS:
           - Activity pacing strategies
           - Ergonomic recommendations
           - Nutrition optimization
           - Sleep quality improvement
           - Stress reduction techniques
           
        6. MONITORING AND ADJUSTMENT:
           - Pain tracking methods
           - Functional outcome measures
           - Side effect monitoring
           - Plan modification triggers
           - Reassessment schedule
           
        7. PATIENT EDUCATION:
           - Pain science education
           - Self-management strategies
           - Warning sign recognition
           - Medication safety
           - When to seek help
           
        Provide personalized, evidence-based management plan with clear timelines.
      `;
      
      const managementPlan = await this.processMessage(planPrompt);
      
      const planData = {
        planId: `plan_${Date.now()}`,
        assessmentId: painAssessment.assessmentId,
        agent: this.name,
        plan: managementPlan,
        multimodalApproach: true,
        opioidSparing: true,
        functionalFocus: true,
        createdAt: new Date().toISOString(),
        confidence: this.getConfidence('pain_management_planning')
      };
      
      // Store intervention plan
      this.painInterventions.set(planData.planId, planData);
      
      return planData;
    } catch (error) {
      logger.error(`Error developing pain management plan: ${error.message}`);
      throw error;
    }
  }

  async monitorPainProgress(planId, progressData) {
    try {
      logger.info(`${this.name} monitoring pain management progress`);
      
      const monitoringPrompt = `
        PAIN MANAGEMENT PROGRESS MONITORING:
        
        Plan ID: ${planId}
        Progress Data: ${JSON.stringify(progressData)}
        Original Plan: ${JSON.stringify(this.painInterventions.get(planId))}
        
        Evaluate current progress and provide recommendations:
        
        1. PAIN INTENSITY TRACKING:
           - Current pain scores vs baseline
           - Pain pattern changes
           - Breakthrough pain episodes
           - Activity-related pain variations
           
        2. FUNCTIONAL IMPROVEMENT:
           - Daily activity performance
           - Work/occupational function
           - Sleep quality changes
           - Recreational activity return
           
        3. INTERVENTION EFFECTIVENESS:
           - Medication response
           - Non-pharmacological success
           - Side effect profile
           - Adherence challenges
           
        4. PSYCHOLOGICAL PROGRESS:
           - Mood and anxiety changes
           - Coping strategy effectiveness
           - Fear-avoidance reduction
           - Self-efficacy improvement
           
        5. PLAN MODIFICATIONS:
           - Dose adjustments needed
           - Intervention additions/changes
           - Timeline modifications
           - Goal reassessment
           
        6. NEXT STEPS:
           - Immediate recommendations
           - Follow-up schedule
           - Specialist referrals
           - Plan optimization
           
        Provide evidence-based progress assessment with actionable recommendations.
      `;
      
      const progressAssessment = await this.processMessage(monitoringPrompt);
      
      // Update intervention plan with progress
      const plan = this.painInterventions.get(planId);
      if (plan) {
        if (!plan.progressUpdates) plan.progressUpdates = [];
        plan.progressUpdates.push({
          update: progressAssessment,
          data: progressData,
          timestamp: new Date().toISOString()
        });
      }
      
      // Calculate potential token rewards based on progress
      const painReduction = this.calculatePainReduction(progressData);
      const functionalImprovement = this.calculateFunctionalImprovement(progressData);
      
      if (painReduction >= 50 || functionalImprovement >= 75) {
        await this.updateExperienceWithTokens({
          success: true,
          reason: 'significant_pain_improvement',
          painReduction,
          functionalImprovement: functionalImprovement >= 75,
          mdApproval: painReduction >= 70,
          userSatisfaction: progressData.satisfaction || 8
        });
      }
      
      return {
        planId,
        progressAssessment,
        painReduction,
        functionalImprovement,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error monitoring pain progress: ${error.message}`);
      throw error;
    }
  }

  async providePainEducation(educationRequest) {
    try {
      logger.info(`${this.name} providing pain education`);
      
      const educationPrompt = `
        COMPREHENSIVE PAIN EDUCATION:
        
        Education Request: ${JSON.stringify(educationRequest)}
        
        Provide patient-friendly pain education covering:
        
        1. PAIN SCIENCE BASICS:
           - What is pain and why it occurs
           - Acute vs chronic pain differences
           - Pain pathway explanation
           - Central sensitization concepts
           
        2. UNDERSTANDING YOUR PAIN:
           - Specific condition explanation
           - Why this pain pattern occurs
           - Normal vs concerning symptoms
           - Recovery timeline expectations
           
        3. SELF-MANAGEMENT STRATEGIES:
           - Activity pacing techniques
           - Breathing and relaxation methods
           - Heat/cold application guidelines
           - Movement and exercise principles
           
        4. MEDICATION WISDOM:
           - How pain medications work
           - Proper usage and timing
           - Side effect management
           - Safety considerations
           
        5. LIFESTYLE FACTORS:
           - Sleep's role in pain recovery
           - Nutrition and inflammation
           - Stress management importance
           - Social support utilization
           
        6. WHEN TO SEEK HELP:
           - Warning signs to watch for
           - Emergency situations
           - When to contact providers
           - Resource availability
           
        7. HOPE AND RECOVERY:
           - Recovery success stories
           - Realistic expectations
           - Goal setting strategies
           - Motivation maintenance
           
        Use clear, empathetic, and empowering language suitable for patient education.
      `;
      
      const education = await this.processMessage(educationPrompt);
      
      return {
        agent: this.name,
        education,
        topic: educationRequest.topic || 'comprehensive_pain_education',
        timestamp: new Date().toISOString(),
        format: 'patient_friendly'
      };
    } catch (error) {
      logger.error(`Error providing pain education: ${error.message}`);
      throw error;
    }
  }

  extractPainScore(assessment) {
    const match = assessment.match(/pain\s+(?:score|level|intensity).*?(\d+)(?:\/10|\s+out\s+of\s+10)/i);
    return match ? parseInt(match[1]) : null;
  }

  extractFunctionalImpact(assessment) {
    const lowKeywords = ['minimal', 'slight', 'mild'];
    const moderateKeywords = ['moderate', 'significant', 'noticeable'];
    const severeKeywords = ['severe', 'major', 'substantial', 'marked'];
    
    const lowerAssessment = assessment.toLowerCase();
    
    if (severeKeywords.some(keyword => lowerAssessment.includes(keyword))) return 'severe';
    if (moderateKeywords.some(keyword => lowerAssessment.includes(keyword))) return 'moderate';
    if (lowKeywords.some(keyword => lowerAssessment.includes(keyword))) return 'mild';
    return 'unknown';
  }

  extractRiskLevel(assessment) {
    const highRiskKeywords = ['chronic', 'central sensitization', 'catastrophizing', 'high risk'];
    const lowRiskKeywords = ['acute', 'well-localized', 'low risk', 'good prognosis'];
    
    const lowerAssessment = assessment.toLowerCase();
    
    if (highRiskKeywords.some(keyword => lowerAssessment.includes(keyword))) return 'high';
    if (lowRiskKeywords.some(keyword => lowerAssessment.includes(keyword))) return 'low';
    return 'moderate';
  }

  calculatePainReduction(progressData) {
    if (progressData.initialPain && progressData.currentPain) {
      const reduction = ((progressData.initialPain - progressData.currentPain) / progressData.initialPain) * 100;
      return Math.max(0, Math.round(reduction));
    }
    return 0;
  }

  calculateFunctionalImprovement(progressData) {
    if (progressData.functionalScore) {
      return progressData.functionalScore.improvement || 0;
    }
    return 0;
  }

  getPainStatistics() {
    const totalAssessments = this.painTrackingHistory.length;
    const totalPlans = this.painInterventions.size;
    
    const riskDistribution = {};
    const painScoreDistribution = {};
    
    for (const assessment of this.painTrackingHistory) {
      const risk = assessment.riskLevel;
      const score = assessment.painScore;
      
      riskDistribution[risk] = (riskDistribution[risk] || 0) + 1;
      if (score !== null) {
        const scoreRange = score <= 3 ? 'mild' : score <= 6 ? 'moderate' : 'severe';
        painScoreDistribution[scoreRange] = (painScoreDistribution[scoreRange] || 0) + 1;
      }
    }
    
    return {
      totalAssessments,
      totalManagementPlans: totalPlans,
      riskDistribution,
      painScoreDistribution,
      tokenBalance: this.tokenBalance,
      experience: this.experience
    };
  }
}

export default PainWhispererAgent;