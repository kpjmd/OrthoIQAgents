import { OrthopedicSpecialist } from './orthopedic-specialist.js';
import logger from '../utils/logger.js';

export class MindMenderAgent extends OrthopedicSpecialist {
  constructor(name = 'Mind Mender') {
    super(name, 'psychological aspects of recovery');
    this.psychologicalAssessments = new Map();
    this.interventionPlans = new Map();
    this.copingStrategies = new Set();
    this.behaviorModifications = [];
  }

  getSystemPrompt() {
    return `You are ${this.name}, the psychological aspects specialist in the OrthoIQ recovery ecosystem.
    
    Your expertise encompasses the complex psychological factors that influence physical recovery, including pain perception, fear-avoidance behaviors, motivation, adherence, and the bidirectional relationship between mental and physical health in orthopedic recovery.
    
    CORE SPECIALIZATIONS:
    - Pain psychology and catastrophizing assessment
    - Fear-avoidance behavior identification and modification
    - Motivation enhancement and adherence strategies
    - Coping skills development and training
    - Anxiety and depression screening in injury context
    - Self-efficacy and confidence building
    - Behavioral change facilitation
    - Mindfulness and stress reduction techniques
    
    PSYCHOLOGICAL ASSESSMENT FRAMEWORK:
    - Pain catastrophizing scale assessment
    - Fear-avoidance beliefs evaluation
    - Depression and anxiety screening
    - Self-efficacy and confidence measures
    - Coping strategies assessment
    - Social support evaluation
    - Motivation and readiness assessment
    - Quality of life impact analysis
    
    Experience level: ${this.experience} points
    Token balance: ${this.tokenBalance}
    Psychological interventions: ${this.interventionPlans.size}
    Wallet: ${this.walletAddress}
    
    EVIDENCE-BASED APPROACHES:
    - Cognitive-behavioral therapy principles
    - Acceptance and commitment therapy
    - Mindfulness-based interventions
    - Motivational interviewing techniques
    - Graded exposure therapy
    - Behavioral activation strategies
    - Social support optimization
    
    TOKEN INCENTIVES:
    - Significant anxiety/depression reduction
    - Fear-avoidance behavior elimination
    - Improved treatment adherence (>90%)
    - Enhanced self-efficacy and confidence
    - Successful coping strategy implementation
    - Quality of life improvements
    
    INTERVENTION FOCUS AREAS:
    - Pain-related fear and avoidance
    - Catastrophic thinking patterns
    - Treatment adherence barriers
    - Motivation and goal engagement
    - Stress and anxiety management
    - Depression and mood regulation
    - Social support optimization
    - Return-to-activity confidence
    
    Your mission is to address the psychological barriers to recovery while building resilience, confidence, and adaptive coping strategies that support optimal physical healing and long-term well-being.`;
  }

  async assessPsychologicalFactors(assessmentData) {
    try {
      logger.info(`${this.name} conducting comprehensive psychological assessment`);
      
      const assessmentPrompt = `
        COMPREHENSIVE PSYCHOLOGICAL ASSESSMENT FOR ORTHOPEDIC RECOVERY:
        
        Assessment Data: ${JSON.stringify(assessmentData)}
        
        Conduct thorough psychological evaluation including:
        
        1. PAIN PSYCHOLOGY ASSESSMENT:
           - Pain catastrophizing tendencies (rumination, magnification, helplessness)
           - Pain-related fear and anxiety levels
           - Pain interference with daily activities
           - Pain coping strategies (adaptive vs maladaptive)
           - Pain self-efficacy and control beliefs
           
        2. FEAR-AVOIDANCE EVALUATION:
           - Fear of movement and re-injury
           - Activity avoidance patterns
           - Kinesiophobia assessment
           - Safety behaviors identification
           - Movement confidence levels
           
        3. MOOD AND EMOTIONAL STATE:
           - Depression symptoms screening
           - Anxiety and worry patterns
           - Emotional regulation abilities
           - Stress levels and stressors
           - Emotional impact of injury
           
        4. COGNITIVE PATTERNS:
           - Catastrophic thinking assessment
           - All-or-nothing thinking patterns
           - Negative self-talk identification
           - Cognitive flexibility evaluation
           - Attention and concentration effects
           
        5. BEHAVIORAL FACTORS:
           - Activity engagement levels
           - Avoidance behaviors
           - Safety-seeking behaviors
           - Sleep and appetite changes
           - Social withdrawal patterns
           
        6. MOTIVATION AND READINESS:
           - Treatment motivation levels
           - Change readiness assessment
           - Goal engagement and commitment
           - Expectation beliefs
           - Recovery optimism/pessimism
           
        7. SOCIAL AND SUPPORT FACTORS:
           - Social support availability and quality
           - Family dynamics and relationships
           - Work and financial stressors
           - Healthcare relationship satisfaction
           - Isolation and loneliness factors
           
        8. SELF-EFFICACY AND CONFIDENCE:
           - Treatment adherence confidence
           - Recovery self-efficacy beliefs
           - Problem-solving confidence
           - Coping self-efficacy
           - Return-to-activity confidence
           
        9. QUALITY OF LIFE IMPACT:
           - Functional impairment assessment
           - Role disruption evaluation
           - Recreational activity impact
           - Relationship effects
           - Life satisfaction changes
           
        Provide comprehensive psychological profile with specific intervention targets identified.
      `;
      
      const assessment = await this.processMessage(assessmentPrompt);
      
      const psychAssessment = {
        assessmentId: `psych_${Date.now()}`,
        agent: this.name,
        agentId: this.agentId,
        assessmentData,
        evaluation: assessment,
        riskFactors: this.extractPsychologicalRisks(assessment),
        protectiveFactors: this.extractProtectiveFactors(assessment),
        interventionTargets: this.extractInterventionTargets(assessment),
        urgencyLevel: this.assessPsychologicalUrgency(assessment),
        confidence: this.getConfidence('psychological_assessment'),
        timestamp: new Date().toISOString()
      };
      
      // Store assessment
      this.psychologicalAssessments.set(psychAssessment.assessmentId, psychAssessment);
      this.updateExperience();
      
      return psychAssessment;
    } catch (error) {
      logger.error(`Error in psychological assessment: ${error.message}`);
      throw error;
    }
  }

  async developPsychologicalIntervention(psychAssessment) {
    try {
      logger.info(`${this.name} developing psychological intervention plan`);
      
      const interventionPrompt = `
        COMPREHENSIVE PSYCHOLOGICAL INTERVENTION PLAN:
        
        Psychological Assessment: ${JSON.stringify(psychAssessment)}
        
        Design evidence-based psychological intervention including:
        
        1. COGNITIVE INTERVENTIONS:
           - Cognitive restructuring for catastrophic thoughts
           - Pain education and understanding
           - Realistic expectation setting
           - Thought challenging techniques
           - Mindfulness and present-moment awareness
           
        2. BEHAVIORAL INTERVENTIONS:
           - Graded exposure to feared activities
           - Activity pacing and scheduling
           - Behavioral activation strategies
           - Goal setting and achievement
           - Relaxation and stress management
           
        3. FEAR-AVOIDANCE MODIFICATION:
           - Movement confidence building
           - Systematic desensitization
           - Safety behavior reduction
           - Gradual activity exposure
           - Success experience creation
           
        4. PAIN COPING STRATEGIES:
           - Adaptive coping skill development
           - Distraction and attention techniques
           - Breathing and relaxation methods
           - Imagery and visualization
           - Acceptance and mindfulness approaches
           
        5. MOTIVATION ENHANCEMENT:
           - Motivational interviewing principles
           - Value clarification exercises
           - Goal alignment and commitment
           - Intrinsic motivation development
           - Barrier identification and problem-solving
           
        6. MOOD REGULATION:
           - Depression intervention strategies
           - Anxiety management techniques
           - Emotional regulation skills
           - Pleasant activity scheduling
           - Social connection enhancement
           
        7. ADHERENCE OPTIMIZATION:
           - Barrier identification and removal
           - Habit formation strategies
           - Self-monitoring techniques
           - Accountability systems
           - Reward and reinforcement plans
           
        8. SOCIAL SUPPORT MOBILIZATION:
           - Support network identification
           - Communication skill development
           - Family education and involvement
           - Peer support connections
           - Professional support utilization
           
        9. SELF-EFFICACY BUILDING:
           - Mastery experience creation
           - Skill development and practice
           - Success attribution training
           - Confidence building exercises
           - Self-advocacy development
           
        10. IMPLEMENTATION STRATEGY:
            - Session structure and frequency
            - Homework and practice assignments
            - Progress monitoring methods
            - Booster session planning
            - Crisis intervention protocols
        
        Provide specific, step-by-step psychological intervention plan with clear objectives and methods.
      `;
      
      const interventionPlan = await this.processMessage(interventionPrompt);
      
      const planData = {
        planId: `psych_plan_${Date.now()}`,
        assessmentId: psychAssessment.assessmentId,
        agent: this.name,
        plan: interventionPlan,
        targetAreas: psychAssessment.interventionTargets,
        interventionType: 'comprehensive_psychological',
        expectedDuration: '12-16 weeks',
        sessionFrequency: 'weekly',
        createdAt: new Date().toISOString(),
        confidence: this.getConfidence('intervention_planning')
      };
      
      // Store intervention plan
      this.interventionPlans.set(planData.planId, planData);
      
      return planData;
    } catch (error) {
      logger.error(`Error developing psychological intervention: ${error.message}`);
      throw error;
    }
  }

  async monitorPsychologicalProgress(planId, progressData) {
    try {
      logger.info(`${this.name} monitoring psychological intervention progress`);
      
      const monitoringPrompt = `
        PSYCHOLOGICAL INTERVENTION PROGRESS MONITORING:
        
        Plan ID: ${planId}
        Progress Data: ${JSON.stringify(progressData)}
        Original Plan: ${JSON.stringify(this.interventionPlans.get(planId))}
        
        Evaluate psychological intervention effectiveness:
        
        1. SYMPTOM IMPROVEMENT:
           - Depression and anxiety reduction
           - Pain catastrophizing changes
           - Fear-avoidance behavior modification
           - Stress and worry level changes
           - Sleep and appetite improvements
           
        2. COGNITIVE CHANGES:
           - Thought pattern modifications
           - Cognitive flexibility improvements
           - Realistic thinking development
           - Problem-solving enhancement
           - Attention and focus changes
           
        3. BEHAVIORAL MODIFICATIONS:
           - Activity engagement increases
           - Avoidance behavior reductions
           - Coping strategy utilization
           - Self-care behavior improvements
           - Social engagement changes
           
        4. SELF-EFFICACY ENHANCEMENT:
           - Confidence level improvements
           - Self-efficacy belief changes
           - Mastery experience accumulation
           - Goal achievement progress
           - Independence development
           
        5. TREATMENT ADHERENCE:
           - Session attendance rates
           - Homework completion
           - Strategy practice frequency
           - Skill application success
           - Engagement and motivation
           
        6. FUNCTIONAL IMPROVEMENTS:
           - Daily activity performance
           - Role function restoration
           - Relationship quality changes
           - Work performance improvements
           - Quality of life enhancement
           
        7. COPING SKILL DEVELOPMENT:
           - New strategy acquisition
           - Skill refinement progress
           - Strategy effectiveness
           - Generalization to new situations
           - Crisis management abilities
           
        8. INTERVENTION ADJUSTMENTS:
           - Strategy modifications needed
           - Session frequency changes
           - Focus area adjustments
           - Booster session requirements
           - Termination planning
           
        Provide evidence-based progress assessment with specific recommendations for continued intervention.
      `;
      
      const progressAssessment = await this.processMessage(monitoringPrompt);
      
      // Update intervention plan with progress
      const plan = this.interventionPlans.get(planId);
      if (plan) {
        if (!plan.progressUpdates) plan.progressUpdates = [];
        plan.progressUpdates.push({
          update: progressAssessment,
          data: progressData,
          timestamp: new Date().toISOString()
        });
      }
      
      // Calculate improvements for token rewards
      const anxietyReduction = this.calculateAnxietyReduction(progressData);
      const adherenceImprovement = this.calculateAdherenceImprovement(progressData);
      const confidenceGains = this.calculateConfidenceGains(progressData);
      
      if (anxietyReduction >= 50 || adherenceImprovement >= 90 || confidenceGains >= 75) {
        await this.updateExperienceWithTokens({
          success: true,
          reason: 'significant_psychological_improvement',
          anxietyReduction: anxietyReduction >= 50,
          adherenceImprovement: adherenceImprovement >= 90,
          confidenceGains: confidenceGains >= 75,
          mdApproval: anxietyReduction >= 60,
          userSatisfaction: progressData.satisfaction || 8,
          functionalImprovement: progressData.functionalImprovement || false
        });
      }
      
      return {
        planId,
        progressAssessment,
        anxietyReduction,
        adherenceImprovement,
        confidenceGains,
        readinessForDischarge: this.assessDischargeReadiness(progressData),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error monitoring psychological progress: ${error.message}`);
      throw error;
    }
  }

  async provideCopingStrategies(copingRequest) {
    try {
      logger.info(`${this.name} providing coping strategies`);
      
      const copingPrompt = `
        PERSONALIZED COPING STRATEGY RECOMMENDATIONS:
        
        Coping Request: ${JSON.stringify(copingRequest)}
        
        Provide specific, actionable coping strategies including:
        
        1. IMMEDIATE COPING TECHNIQUES:
           - Quick anxiety relief methods
           - Pain flare-up management
           - Stress reduction techniques
           - Crisis intervention strategies
           - Emergency coping plans
           
        2. COGNITIVE COPING STRATEGIES:
           - Thought challenging techniques
           - Realistic thinking practices
           - Perspective-taking exercises
           - Problem-solving methods
           - Mindfulness techniques
           
        3. BEHAVIORAL COPING APPROACHES:
           - Relaxation and breathing exercises
           - Activity pacing strategies
           - Distraction techniques
           - Physical comfort measures
           - Movement and exercise integration
           
        4. EMOTIONAL REGULATION SKILLS:
           - Emotion identification techniques
           - Emotional expression methods
           - Mood regulation strategies
           - Stress management approaches
           - Emotional tolerance building
           
        5. SOCIAL COPING RESOURCES:
           - Support network utilization
           - Communication strategies
           - Help-seeking behaviors
           - Boundary setting techniques
           - Relationship maintenance
           
        6. MEANING-MAKING AND ACCEPTANCE:
           - Value clarification exercises
           - Acceptance strategies
           - Post-traumatic growth facilitation
           - Resilience building techniques
           - Hope and optimism cultivation
           
        7. PRACTICAL COPING TOOLS:
           - Daily routine structures
           - Self-care planning
           - Energy management
           - Time management strategies
           - Environmental modifications
           
        8. LONG-TERM COPING DEVELOPMENT:
           - Skill practice schedules
           - Strategy refinement plans
           - Generalization techniques
           - Maintenance strategies
           - Relapse prevention
           
        Provide practical, evidence-based coping strategies tailored to the specific request.
      `;
      
      const copingStrategies = await this.processMessage(copingPrompt);
      
      // Add to coping strategies set
      const strategyData = {
        strategyId: `coping_${Date.now()}`,
        agent: this.name,
        request: copingRequest,
        strategies: copingStrategies,
        timestamp: new Date().toISOString()
      };
      
      this.copingStrategies.add(strategyData.strategyId);
      
      return strategyData;
    } catch (error) {
      logger.error(`Error providing coping strategies: ${error.message}`);
      throw error;
    }
  }

  async providePsychoeducation(educationRequest) {
    try {
      logger.info(`${this.name} providing psychological education`);
      
      const educationPrompt = `
        PSYCHOLOGICAL EDUCATION FOR RECOVERY:
        
        Education Request: ${JSON.stringify(educationRequest)}
        
        Provide patient-friendly psychological education covering:
        
        1. MIND-BODY CONNECTION:
           - How thoughts affect physical recovery
           - Pain and emotion relationships
           - Stress impact on healing
           - Brain plasticity and recovery
           
        2. UNDERSTANDING YOUR RESPONSES:
           - Normal psychological reactions to injury
           - Fear and anxiety explanations
           - Grief and loss in injury context
           - Adaptation and resilience concepts
           
        3. PAIN PSYCHOLOGY BASICS:
           - Pain perception and processing
           - Chronic vs acute pain differences
           - Central sensitization concepts
           - Pain-emotion connections
           
        4. RECOVERY PSYCHOLOGY:
           - Motivation and recovery relationship
           - Adherence importance and strategies
           - Goal setting and achievement
           - Setback normalization and management
           
        5. COPING AND RESILIENCE:
           - Adaptive vs maladaptive coping
           - Resilience building techniques
           - Stress management importance
           - Support system utilization
           
        6. BEHAVIORAL CHANGE:
           - Habit formation principles
           - Motivation enhancement
           - Barrier identification and overcoming
           - Success strategy development
           
        7. SELF-ADVOCACY AND EMPOWERMENT:
           - Communication with healthcare providers
           - Decision-making participation
           - Self-monitoring and awareness
           - Confidence building approaches
           
        Use compassionate, empowering language that validates experiences while promoting growth and recovery.
      `;
      
      const education = await this.processMessage(educationPrompt);
      
      return {
        agent: this.name,
        education,
        topic: educationRequest.topic || 'comprehensive_psychological_education',
        timestamp: new Date().toISOString(),
        format: 'patient_friendly'
      };
    } catch (error) {
      logger.error(`Error providing psychological education: ${error.message}`);
      throw error;
    }
  }

  extractPsychologicalRisks(assessment) {
    const risks = [];
    const riskKeywords = {
      'high_catastrophizing': ['catastrophizing', 'catastrophic thinking'],
      'severe_fear_avoidance': ['fear avoidance', 'kinesiophobia'],
      'significant_depression': ['depression', 'depressed mood'],
      'high_anxiety': ['anxiety', 'anxious'],
      'poor_coping': ['poor coping', 'maladaptive coping'],
      'low_self_efficacy': ['low confidence', 'low self-efficacy'],
      'social_isolation': ['isolated', 'poor support']
    };
    
    const lowerAssessment = assessment.toLowerCase();
    
    Object.entries(riskKeywords).forEach(([risk, keywords]) => {
      if (keywords.some(keyword => lowerAssessment.includes(keyword))) {
        risks.push(risk);
      }
    });
    
    return risks;
  }

  extractProtectiveFactors(assessment) {
    const factors = [];
    const protectiveKeywords = {
      'good_social_support': ['good support', 'strong support'],
      'high_motivation': ['motivated', 'high motivation'],
      'adaptive_coping': ['good coping', 'adaptive coping'],
      'realistic_expectations': ['realistic', 'appropriate expectations'],
      'positive_outlook': ['optimistic', 'positive outlook'],
      'good_self_efficacy': ['confident', 'high self-efficacy']
    };
    
    const lowerAssessment = assessment.toLowerCase();
    
    Object.entries(protectiveKeywords).forEach(([factor, keywords]) => {
      if (keywords.some(keyword => lowerAssessment.includes(keyword))) {
        factors.push(factor);
      }
    });
    
    return factors;
  }

  extractInterventionTargets(assessment) {
    const targets = [];
    const targetKeywords = {
      'catastrophizing_reduction': ['catastrophizing'],
      'fear_avoidance_modification': ['fear avoidance'],
      'depression_treatment': ['depression'],
      'anxiety_management': ['anxiety'],
      'coping_skill_development': ['coping'],
      'motivation_enhancement': ['motivation'],
      'adherence_improvement': ['adherence'],
      'confidence_building': ['confidence', 'self-efficacy']
    };
    
    const lowerAssessment = assessment.toLowerCase();
    
    Object.entries(targetKeywords).forEach(([target, keywords]) => {
      if (keywords.some(keyword => lowerAssessment.includes(keyword))) {
        targets.push(target);
      }
    });
    
    return targets;
  }

  assessPsychologicalUrgency(assessment) {
    const highUrgencyKeywords = ['severe depression', 'suicidal', 'crisis', 'severe anxiety'];
    const moderateUrgencyKeywords = ['moderate depression', 'significant anxiety', 'marked impairment'];
    
    const lowerAssessment = assessment.toLowerCase();
    
    if (highUrgencyKeywords.some(keyword => lowerAssessment.includes(keyword))) return 'high';
    if (moderateUrgencyKeywords.some(keyword => lowerAssessment.includes(keyword))) return 'moderate';
    return 'low';
  }

  calculateAnxietyReduction(progressData) {
    if (progressData.anxietyScores) {
      const initial = progressData.anxietyScores.initial || 10;
      const current = progressData.anxietyScores.current || initial;
      return Math.round(((initial - current) / initial) * 100);
    }
    return 0;
  }

  calculateAdherenceImprovement(progressData) {
    if (progressData.adherenceRate) {
      return progressData.adherenceRate || 0;
    }
    return 0;
  }

  calculateConfidenceGains(progressData) {
    if (progressData.confidenceScores) {
      const initial = progressData.confidenceScores.initial || 1;
      const current = progressData.confidenceScores.current || initial;
      return Math.round(((current - initial) / 9) * 100); // Assuming 1-10 scale
    }
    return 0;
  }

  assessDischargeReadiness(progressData) {
    let readiness = 0;
    
    if (progressData.anxietyScores?.current <= 3) readiness += 25;
    if (progressData.adherenceRate >= 90) readiness += 25;
    if (progressData.confidenceScores?.current >= 8) readiness += 25;
    if (progressData.copingSkillMastery >= 80) readiness += 25;
    
    return readiness;
  }

  getPsychologicalStatistics() {
    const totalAssessments = this.psychologicalAssessments.size;
    const totalInterventions = this.interventionPlans.size;
    const totalCopingStrategies = this.copingStrategies.size;
    
    const riskDistribution = {};
    const urgencyDistribution = {};
    
    for (const [id, assessment] of this.psychologicalAssessments) {
      const urgency = assessment.urgencyLevel;
      urgencyDistribution[urgency] = (urgencyDistribution[urgency] || 0) + 1;
      
      if (assessment.riskFactors) {
        assessment.riskFactors.forEach(risk => {
          riskDistribution[risk] = (riskDistribution[risk] || 0) + 1;
        });
      }
    }
    
    return {
      totalAssessments,
      totalInterventions,
      totalCopingStrategies,
      riskFactorDistribution: riskDistribution,
      urgencyDistribution,
      tokenBalance: this.tokenBalance,
      experience: this.experience
    };
  }
}

export default MindMenderAgent;