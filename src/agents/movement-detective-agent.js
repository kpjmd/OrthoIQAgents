import { OrthopedicSpecialist } from './orthopedic-specialist.js';
import logger from '../utils/logger.js';

export class MovementDetectiveAgent extends OrthopedicSpecialist {
  constructor(name = 'Movement Detective') {
    super(name, 'biomechanics and movement analysis');
    this.movementPatterns = new Map();
    this.biomechanicalAssessments = [];
    this.compensatoryPatterns = new Set();
    this.movementInterventions = new Map();
  }

  getSystemPrompt() {
    return `You are ${this.name}, the biomechanics and movement analysis specialist in the OrthoIQ recovery ecosystem.
    
    Your expertise lies in understanding the intricate relationships between anatomy, biomechanics, and functional movement to optimize recovery and prevent future injury through movement pattern analysis and correction.
    
    CORE SPECIALIZATIONS:
    - Comprehensive movement pattern analysis
    - Biomechanical dysfunction identification
    - Compensatory movement pattern detection
    - Gait and locomotion assessment
    - Sport-specific movement analysis
    - Postural assessment and correction
    - Kinetic chain evaluation
    - Movement re-education strategies
    
    ASSESSMENT FRAMEWORK:
    - Static postural analysis
    - Dynamic movement screening
    - Gait analysis and locomotion patterns
    - Sport-specific movement assessment
    - Kinetic chain evaluation
    - Muscle activation patterns
    - Range of motion assessment
    - Stability and balance testing
    
    Experience level: ${this.experience} points
    Token balance: ${this.tokenBalance}
    Movement assessments: ${this.biomechanicalAssessments.length}
    Wallet: ${this.walletAddress}
    
    EVIDENCE-BASED APPROACHES:
    - Functional Movement Screen (FMS) principles
    - Selective Functional Movement Assessment (SFMA)
    - Movement system impairment classification
    - Corrective exercise prescription
    - Motor control and learning principles
    - Neuromuscular re-education techniques
    
    TOKEN INCENTIVES:
    - Movement pattern improvement (>75% correction)
    - Injury recurrence prevention
    - Functional capacity enhancement
    - Return to sport/activity success
    - Patient education effectiveness
    - Collaboration with other specialists
    
    ASSESSMENT TOOLS:
    - Video movement analysis
    - Postural grid assessment
    - Functional movement screens
    - Sport-specific testing
    - Balance and proprioception testing
    - Strength and flexibility evaluation
    
    Your mission is to decode movement mysteries, identify dysfunction patterns, and prescribe targeted interventions that restore optimal movement and prevent future injury through biomechanically sound approaches.`;
  }

  async analyzeMovementPattern(movementData) {
    try {
      logger.info(`${this.name} analyzing movement patterns`);
      
      const analysisPrompt = `
        COMPREHENSIVE MOVEMENT PATTERN ANALYSIS:
        
        Movement Data: ${JSON.stringify(movementData)}
        
        Conduct thorough biomechanical assessment including:
        
        1. STATIC POSTURAL ASSESSMENT:
           - Sagittal plane alignment (anterior/posterior view)
           - Frontal plane assessment (lateral view)
           - Transverse plane evaluation (rotational components)
           - Postural deviations and asymmetries
           - Core stability and alignment
           
        2. DYNAMIC MOVEMENT SCREENING:
           - Functional movement patterns
           - Movement quality assessment
           - Asymmetries and compensations
           - Range of motion limitations
           - Stability and mobility balance
           
        3. GAIT ANALYSIS:
           - Stance phase abnormalities
           - Swing phase deviations
           - Cadence and stride characteristics
           - Ground reaction forces
           - Compensatory mechanisms
           
        4. KINETIC CHAIN EVALUATION:
           - Proximal to distal force transmission
           - Joint coupling patterns
           - Muscle activation sequences
           - Force production and absorption
           - Energy transfer efficiency
           
        5. COMPENSATORY PATTERN IDENTIFICATION:
           - Primary dysfunction vs compensation
           - Adaptation strategies
           - Movement substitutions
           - Risk for secondary injury
           
        6. SPORT/ACTIVITY-SPECIFIC ANALYSIS:
           - Task-specific movement demands
           - Performance limitations
           - Injury risk factors
           - Return-to-activity readiness
           
        7. NEUROMUSCULAR CONTROL:
           - Motor control strategies
           - Proprioceptive awareness
           - Reactive balance responses
           - Anticipatory adjustments
           
        Provide detailed biomechanical analysis with specific dysfunction patterns identified.
      `;
      
      const analysis = await this.processMessage(analysisPrompt);
      
      const movementAssessment = {
        assessmentId: `movement_${Date.now()}`,
        agent: this.name,
        agentId: this.agentId,
        movementData,
        analysis,
        dysfunctionPatterns: this.extractDysfunctionPatterns(analysis),
        compensatoryPatterns: this.extractCompensatoryPatterns(analysis),
        riskLevel: this.assessMovementRisk(analysis),
        confidence: this.getConfidence('movement_analysis'),
        timestamp: new Date().toISOString()
      };
      
      // Store assessment
      this.biomechanicalAssessments.push(movementAssessment);
      this.movementPatterns.set(movementAssessment.assessmentId, movementAssessment);
      
      // Track compensatory patterns
      if (movementAssessment.compensatoryPatterns) {
        movementAssessment.compensatoryPatterns.forEach(pattern => 
          this.compensatoryPatterns.add(pattern)
        );
      }
      
      this.updateExperience();
      
      return movementAssessment;
    } catch (error) {
      logger.error(`Error in movement pattern analysis: ${error.message}`);
      throw error;
    }
  }

  async developMovementPlan(movementAssessment) {
    try {
      logger.info(`${this.name} developing movement correction plan`);
      
      const planPrompt = `
        COMPREHENSIVE MOVEMENT CORRECTION PLAN:
        
        Movement Assessment: ${JSON.stringify(movementAssessment)}
        
        Develop systematic movement intervention strategy:
        
        1. CORRECTIVE EXERCISE PRESCRIPTION:
           - Inhibition techniques for overactive muscles
           - Lengthening strategies for tight structures
           - Activation exercises for underactive muscles
           - Integration movements for proper patterns
           
        2. NEUROMUSCULAR RE-EDUCATION:
           - Motor control training
           - Proprioceptive enhancement
           - Balance and stability progression
           - Coordination development
           
        3. MOVEMENT PATTERN TRAINING:
           - Fundamental movement patterns
           - Progressive loading strategies
           - Functional movement integration
           - Sport-specific movement preparation
           
        4. POSTURAL CORRECTION:
           - Ergonomic recommendations
           - Postural awareness training
           - Environmental modifications
           - Daily habit modifications
           
        5. FLEXIBILITY AND MOBILITY:
           - Static stretching protocols
           - Dynamic mobility exercises
           - Joint mobilization techniques
           - Fascial release strategies
           
        6. STRENGTH AND CONDITIONING:
           - Progressive strength training
           - Power development protocols
           - Endurance conditioning
           - Sport-specific preparation
           
        7. PROGRESSION TIMELINE:
           - Phase 1: Corrective (weeks 1-4)
           - Phase 2: Integration (weeks 5-8)
           - Phase 3: Performance (weeks 9-12)
           - Phase 4: Maintenance (ongoing)
           
        8. MONITORING AND ASSESSMENT:
           - Movement quality checkpoints
           - Progress measurement tools
           - Reassessment schedule
           - Modification triggers
           
        Provide specific, progressive, and evidence-based movement intervention plan.
      `;
      
      const correctionPlan = await this.processMessage(planPrompt);
      
      const planData = {
        planId: `plan_${Date.now()}`,
        assessmentId: movementAssessment.assessmentId,
        agent: this.name,
        plan: correctionPlan,
        phases: ['corrective', 'integration', 'performance', 'maintenance'],
        currentPhase: 'corrective',
        createdAt: new Date().toISOString(),
        confidence: this.getConfidence('movement_planning')
      };
      
      // Store intervention plan
      this.movementInterventions.set(planData.planId, planData);
      
      return planData;
    } catch (error) {
      logger.error(`Error developing movement plan: ${error.message}`);
      throw error;
    }
  }

  async monitorMovementProgress(planId, progressData) {
    try {
      logger.info(`${this.name} monitoring movement correction progress`);
      
      const monitoringPrompt = `
        MOVEMENT CORRECTION PROGRESS MONITORING:
        
        Plan ID: ${planId}
        Progress Data: ${JSON.stringify(progressData)}
        Original Plan: ${JSON.stringify(this.movementInterventions.get(planId))}
        
        Evaluate movement improvement and plan progression:
        
        1. MOVEMENT QUALITY ASSESSMENT:
           - Pattern correction percentage
           - Compensatory pattern reduction
           - Movement efficiency improvements
           - Symmetry restoration
           
        2. FUNCTIONAL IMPROVEMENT:
           - Daily activity performance
           - Sport/work-specific improvements
           - Pain reduction during movement
           - Endurance and capacity gains
           
        3. NEUROMUSCULAR CONTROL:
           - Motor control improvements
           - Proprioceptive enhancement
           - Balance and stability gains
           - Reaction time improvements
           
        4. STRENGTH AND FLEXIBILITY:
           - Range of motion improvements
           - Strength gains in key muscles
           - Power development
           - Flexibility/mobility progress
           
        5. PHASE PROGRESSION:
           - Current phase completion
           - Readiness for advancement
           - Timeline adherence
           - Modification needs
           
        6. RISK REDUCTION:
           - Injury risk factor elimination
           - Movement safety improvements
           - Load tolerance increases
           - Resilience building
           
        7. NEXT STEPS:
           - Immediate recommendations
           - Phase progression decisions
           - Plan modifications
           - Long-term strategy
           
        Provide evidence-based progress assessment with specific recommendations.
      `;
      
      const progressAssessment = await this.processMessage(monitoringPrompt);
      
      // Update intervention plan with progress
      const plan = this.movementInterventions.get(planId);
      if (plan) {
        if (!plan.progressUpdates) plan.progressUpdates = [];
        plan.progressUpdates.push({
          update: progressAssessment,
          data: progressData,
          timestamp: new Date().toISOString()
        });
        
        // Update phase if progression criteria met
        if (progressData.phaseProgression) {
          plan.currentPhase = progressData.phaseProgression;
        }
      }
      
      // Calculate movement improvement for token rewards
      const movementImprovement = this.calculateMovementImprovement(progressData);
      const functionalGains = this.calculateFunctionalGains(progressData);
      
      if (movementImprovement >= 75 || functionalGains >= 80) {
        await this.updateExperienceWithTokens({
          success: true,
          reason: 'significant_movement_improvement',
          functionalImprovement: functionalGains >= 80,
          movementCorrection: movementImprovement,
          mdApproval: movementImprovement >= 85,
          userSatisfaction: progressData.satisfaction || 9
        });
      }
      
      return {
        planId,
        progressAssessment,
        movementImprovement,
        functionalGains,
        currentPhase: plan?.currentPhase,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error monitoring movement progress: ${error.message}`);
      throw error;
    }
  }

  async analyzeGaitPattern(gaitData) {
    try {
      logger.info(`${this.name} analyzing gait pattern`);
      
      const gaitPrompt = `
        COMPREHENSIVE GAIT ANALYSIS:
        
        Gait Data: ${JSON.stringify(gaitData)}
        
        Perform detailed gait assessment including:
        
        1. TEMPORAL-SPATIAL PARAMETERS:
           - Cadence (steps per minute)
           - Stride length and symmetry
           - Step width and variability
           - Velocity and acceleration patterns
           
        2. STANCE PHASE ANALYSIS:
           - Initial contact patterns
           - Loading response
           - Mid-stance stability
           - Terminal stance push-off
           
        3. SWING PHASE EVALUATION:
           - Initial swing clearance
           - Mid-swing advancement
           - Terminal swing preparation
           - Ground clearance adequacy
           
        4. KINEMATIC ASSESSMENT:
           - Joint angle progressions
           - Sagittal plane motions
           - Frontal plane deviations
           - Transverse plane rotations
           
        5. COMPENSATORY MECHANISMS:
           - Hip hiking patterns
           - Circumduction strategies
           - Trendelenburg patterns
           - Antalgic modifications
           
        6. ENERGY EFFICIENCY:
           - Metabolic cost assessment
           - Energy transfer patterns
           - Mechanical efficiency
           - Fatigue effects
           
        7. FUNCTIONAL IMPLICATIONS:
           - Fall risk assessment
           - Mobility limitations
           - Activity restrictions
           - Intervention priorities
           
        Provide detailed gait analysis with specific recommendations for improvement.
      `;
      
      const gaitAnalysis = await this.processMessage(gaitPrompt);
      
      return {
        analysisId: `gait_${Date.now()}`,
        agent: this.name,
        gaitData,
        analysis: gaitAnalysis,
        deviations: this.extractGaitDeviations(gaitAnalysis),
        riskLevel: this.assessGaitRisk(gaitAnalysis),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error in gait analysis: ${error.message}`);
      throw error;
    }
  }

  async provideMovementEducation(educationRequest) {
    try {
      logger.info(`${this.name} providing movement education`);
      
      const educationPrompt = `
        MOVEMENT AND BIOMECHANICS EDUCATION:
        
        Education Request: ${JSON.stringify(educationRequest)}
        
        Provide patient-friendly movement education covering:
        
        1. MOVEMENT FUNDAMENTALS:
           - How proper movement works
           - Common movement mistakes
           - Benefits of good biomechanics
           - Cost of poor movement patterns
           
        2. YOUR SPECIFIC PATTERNS:
           - Individual movement assessment
           - Key areas for improvement
           - Why these patterns developed
           - How to recognize good vs poor movement
           
        3. DAILY MOVEMENT AWARENESS:
           - Posture throughout the day
           - Movement quality during activities
           - Environmental considerations
           - Habit formation strategies
           
        4. EXERCISE EXECUTION:
           - Proper form principles
           - Quality vs quantity focus
           - Progression guidelines
           - Safety considerations
           
        5. BODY AWARENESS:
           - Proprioceptive development
           - Movement self-assessment
           - Fatigue recognition
           - Pain vs discomfort
           
        6. INJURY PREVENTION:
           - Movement risk factors
           - Early warning signs
           - Protective strategies
           - Long-term movement health
           
        7. PERFORMANCE OPTIMIZATION:
           - Efficient movement patterns
           - Energy conservation
           - Skill development
           - Movement mastery
           
        Use clear, engaging language with practical examples and actionable guidance.
      `;
      
      const education = await this.processMessage(educationPrompt);
      
      return {
        agent: this.name,
        education,
        topic: educationRequest.topic || 'comprehensive_movement_education',
        timestamp: new Date().toISOString(),
        format: 'patient_friendly'
      };
    } catch (error) {
      logger.error(`Error providing movement education: ${error.message}`);
      throw error;
    }
  }

  extractDysfunctionPatterns(analysis) {
    const patterns = [];
    const keywords = {
      'anterior_head_posture': ['forward head', 'anterior head'],
      'rounded_shoulders': ['rounded shoulders', 'protracted shoulders'],
      'excessive_lordosis': ['excessive lordosis', 'anterior pelvic tilt'],
      'knee_valgus': ['knee valgus', 'knock knees'],
      'foot_pronation': ['excessive pronation', 'flat feet'],
      'hip_drop': ['hip drop', 'trendelenburg'],
      'asymmetric_loading': ['asymmetric', 'unilateral']
    };
    
    const lowerAnalysis = analysis.toLowerCase();
    
    Object.entries(keywords).forEach(([pattern, terms]) => {
      if (terms.some(term => lowerAnalysis.includes(term))) {
        patterns.push(pattern);
      }
    });
    
    return patterns;
  }

  extractCompensatoryPatterns(analysis) {
    const patterns = [];
    const compensations = [
      'hip_hiking', 'circumduction', 'ankle_substitution',
      'trunk_lean', 'arm_swing_asymmetry', 'step_length_asymmetry'
    ];
    
    const lowerAnalysis = analysis.toLowerCase();
    
    compensations.forEach(pattern => {
      const searchTerms = pattern.replace('_', ' ');
      if (lowerAnalysis.includes(searchTerms)) {
        patterns.push(pattern);
      }
    });
    
    return patterns;
  }

  assessMovementRisk(analysis) {
    const highRiskKeywords = ['severe', 'marked', 'significant asymmetry', 'multiple compensations'];
    const lowRiskKeywords = ['mild', 'minimal', 'good', 'adequate'];
    
    const lowerAnalysis = analysis.toLowerCase();
    
    if (highRiskKeywords.some(keyword => lowerAnalysis.includes(keyword))) return 'high';
    if (lowRiskKeywords.some(keyword => lowerAnalysis.includes(keyword))) return 'low';
    return 'moderate';
  }

  extractGaitDeviations(gaitAnalysis) {
    const deviations = [];
    const gaitProblems = [
      'antalgic', 'trendelenburg', 'circumduction', 'steppage',
      'scissoring', 'crouched', 'stiff_knee', 'foot_drop'
    ];
    
    const lowerAnalysis = gaitAnalysis.toLowerCase();
    
    gaitProblems.forEach(deviation => {
      const searchTerm = deviation.replace('_', ' ');
      if (lowerAnalysis.includes(searchTerm)) {
        deviations.push(deviation);
      }
    });
    
    return deviations;
  }

  assessGaitRisk(gaitAnalysis) {
    const fallRiskKeywords = ['unsteady', 'fall risk', 'balance deficit', 'unstable'];
    const normalKeywords = ['normal', 'stable', 'good balance'];
    
    const lowerAnalysis = gaitAnalysis.toLowerCase();
    
    if (fallRiskKeywords.some(keyword => lowerAnalysis.includes(keyword))) return 'high';
    if (normalKeywords.some(keyword => lowerAnalysis.includes(keyword))) return 'low';
    return 'moderate';
  }

  calculateMovementImprovement(progressData) {
    if (progressData.movementQuality) {
      return progressData.movementQuality.improvement || 0;
    }
    return 0;
  }

  calculateFunctionalGains(progressData) {
    if (progressData.functionalGains) {
      return progressData.functionalGains.overall || 0;
    }
    return 0;
  }

  getMovementStatistics() {
    const totalAssessments = this.biomechanicalAssessments.length;
    const totalPlans = this.movementInterventions.size;
    
    const dysfunctionDistribution = {};
    const riskDistribution = {};
    
    for (const assessment of this.biomechanicalAssessments) {
      const risk = assessment.riskLevel;
      riskDistribution[risk] = (riskDistribution[risk] || 0) + 1;
      
      if (assessment.dysfunctionPatterns) {
        assessment.dysfunctionPatterns.forEach(pattern => {
          dysfunctionDistribution[pattern] = (dysfunctionDistribution[pattern] || 0) + 1;
        });
      }
    }
    
    return {
      totalAssessments,
      totalCorrectionPlans: totalPlans,
      compensatoryPatterns: Array.from(this.compensatoryPatterns),
      dysfunctionDistribution,
      riskDistribution,
      tokenBalance: this.tokenBalance,
      experience: this.experience
    };
  }
}

export default MovementDetectiveAgent;