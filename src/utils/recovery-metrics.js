import logger from './logger.js';

export class RecoveryMetrics {
  constructor() {
    this.patientRecords = new Map();
    this.outcomeMetrics = new Map();
    this.recoveryTimelines = new Map();
    this.benchmarkData = this.initializeBenchmarks();
    this.qualityIndicators = new Map();
  }

  initializeBenchmarks() {
    return {
      painReduction: {
        excellent: 75, // >75% pain reduction
        good: 50,      // 50-75% pain reduction
        fair: 25,      // 25-50% pain reduction
        poor: 0        // <25% pain reduction
      },
      functionalImprovement: {
        excellent: 85, // >85% functional improvement
        good: 70,      // 70-85% functional improvement
        fair: 50,      // 50-70% functional improvement
        poor: 30       // <30% functional improvement
      },
      returnToActivity: {
        sport_timeline: {
          non_contact: '12-16 weeks',
          contact: '16-24 weeks',
          elite: '20-32 weeks'
        },
        work_timeline: {
          desk_work: '2-6 weeks',
          light_manual: '6-12 weeks',
          heavy_manual: '12-24 weeks'
        }
      },
      satisfactionScores: {
        excellent: 9, // >9/10 satisfaction
        good: 7,      // 7-9/10 satisfaction
        fair: 5,      // 5-7/10 satisfaction
        poor: 3       // <3/10 satisfaction
      }
    };
  }

  async trackPatientRecovery(patientId, initialAssessment) {
    try {
      logger.info(`Starting recovery tracking for patient: ${patientId}`);
      
      const recoveryRecord = {
        patientId,
        startDate: new Date().toISOString(),
        initialAssessment,
        progressUpdates: [],
        milestones: [],
        complications: [],
        finalOutcome: null,
        totalDuration: null,
        recoveryPhase: 'acute',
        status: 'active'
      };
      
      // Extract baseline metrics
      const baselineMetrics = this.extractBaselineMetrics(initialAssessment);
      recoveryRecord.baselineMetrics = baselineMetrics;
      
      // Set initial recovery goals
      const recoveryGoals = this.establishRecoveryGoals(baselineMetrics, initialAssessment);
      recoveryRecord.recoveryGoals = recoveryGoals;
      
      // Calculate expected timeline
      const expectedTimeline = this.calculateExpectedTimeline(initialAssessment);
      recoveryRecord.expectedTimeline = expectedTimeline;
      
      // Store record
      this.patientRecords.set(patientId, recoveryRecord);
      this.recoveryTimelines.set(patientId, this.createTimelineTracker(expectedTimeline));
      
      logger.info(`Recovery tracking initialized for patient ${patientId}`);
      
      return {
        patientId,
        baselineMetrics,
        recoveryGoals,
        expectedTimeline,
        trackingStarted: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error starting recovery tracking: ${error.message}`);
      throw error;
    }
  }

  async updateRecoveryProgress(patientId, progressData) {
    try {
      const record = this.patientRecords.get(patientId);
      if (!record) {
        throw new Error(`Patient record not found: ${patientId}`);
      }
      
      logger.info(`Updating recovery progress for patient: ${patientId}`);
      
      // Create progress update
      const progressUpdate = {
        updateId: `update_${Date.now()}`,
        timestamp: new Date().toISOString(),
        data: progressData,
        metrics: this.calculateProgressMetrics(progressData, record.baselineMetrics),
        phase: this.determineRecoveryPhase(progressData, record),
        milestoneReached: null,
        recommendations: []
      };
      
      // Check for milestone achievement
      const milestone = this.checkMilestoneAchievement(progressUpdate, record);
      if (milestone) {
        progressUpdate.milestoneReached = milestone;
        record.milestones.push(milestone);
      }
      
      // Update recovery phase if changed
      if (progressUpdate.phase !== record.recoveryPhase) {
        record.recoveryPhase = progressUpdate.phase;
        logger.info(`Patient ${patientId} progressed to ${progressUpdate.phase} phase`);
      }
      
      // Generate recommendations based on progress
      progressUpdate.recommendations = this.generateProgressRecommendations(
        progressUpdate,
        record
      );
      
      // Add to progress history
      record.progressUpdates.push(progressUpdate);
      
      // Update timeline tracker
      this.updateTimelineTracker(patientId, progressUpdate);
      
      // Check for complications or concerning trends
      const riskAssessment = this.assessProgressRisk(record);
      if (riskAssessment.risk === 'high') {
        logger.warn(`High risk detected for patient ${patientId}: ${riskAssessment.reason}`);
        progressUpdate.riskAlert = riskAssessment;
      }
      
      return {
        patientId,
        progressUpdate,
        currentPhase: record.recoveryPhase,
        milestonesReached: record.milestones.length,
        riskAssessment,
        recommendations: progressUpdate.recommendations
      };
    } catch (error) {
      logger.error(`Error updating recovery progress: ${error.message}`);
      throw error;
    }
  }

  async completeRecoveryTracking(patientId, finalOutcome) {
    try {
      const record = this.patientRecords.get(patientId);
      if (!record) {
        throw new Error(`Patient record not found: ${patientId}`);
      }
      
      logger.info(`Completing recovery tracking for patient: ${patientId}`);
      
      // Calculate final metrics
      const finalMetrics = this.calculateFinalMetrics(record, finalOutcome);
      
      // Generate outcome analysis
      const outcomeAnalysis = this.analyzeRecoveryOutcome(record, finalMetrics);
      
      // Update record
      record.finalOutcome = finalOutcome;
      record.finalMetrics = finalMetrics;
      record.outcomeAnalysis = outcomeAnalysis;
      record.completionDate = new Date().toISOString();
      record.totalDuration = this.calculateTotalDuration(record.startDate, record.completionDate);
      record.status = 'completed';
      
      // Store outcome metrics for benchmarking
      this.storeOutcomeMetrics(patientId, record);
      
      // Generate quality indicators
      const qualityIndicators = this.generateQualityIndicators(record);
      this.qualityIndicators.set(patientId, qualityIndicators);
      
      logger.info(`Recovery tracking completed for patient ${patientId}`);
      
      return {
        patientId,
        finalMetrics,
        outcomeAnalysis,
        qualityIndicators,
        totalDuration: record.totalDuration,
        success: outcomeAnalysis.overallSuccess
      };
    } catch (error) {
      logger.error(`Error completing recovery tracking: ${error.message}`);
      throw error;
    }
  }

  extractBaselineMetrics(assessment) {
    return {
      painLevel: assessment.painLevel || 0,
      functionalScore: assessment.functionalScore || 0,
      rangeOfMotion: assessment.rangeOfMotion || {},
      strengthMetrics: assessment.strengthMetrics || {},
      qualityOfLife: assessment.qualityOfLife || 0,
      activityLevel: assessment.activityLevel || 0,
      psychologicalWellbeing: assessment.psychologicalWellbeing || 0,
      timestamp: new Date().toISOString()
    };
  }

  establishRecoveryGoals(baselineMetrics, assessment) {
    const condition = assessment.condition || 'general';
    const severity = assessment.severity || 'moderate';
    
    return {
      painReduction: this.calculatePainReductionGoal(baselineMetrics.painLevel, severity),
      functionalImprovement: this.calculateFunctionalGoal(baselineMetrics.functionalScore, condition),
      rangeOfMotionGoals: this.setROMGoals(baselineMetrics.rangeOfMotion, assessment),
      strengthGoals: this.setStrengthGoals(baselineMetrics.strengthMetrics, assessment),
      activityGoals: this.setActivityGoals(baselineMetrics.activityLevel, assessment),
      timelineGoals: this.setTimelineGoals(condition, severity),
      qualityOfLifeGoals: this.setQOLGoals(baselineMetrics.qualityOfLife)
    };
  }

  calculateExpectedTimeline(assessment) {
    const condition = assessment.condition || 'general';
    const severity = assessment.severity || 'moderate';
    const age = assessment.age || 45;
    const comorbidities = assessment.comorbidities || [];
    
    // Base timeline by condition
    let baseWeeks = 12;
    
    const conditionTimelines = {
      'rotator_cuff': 16,
      'acl_reconstruction': 24,
      'meniscus_repair': 12,
      'shoulder_dislocation': 8,
      'ankle_sprain': 6,
      'back_strain': 8,
      'total_knee': 20,
      'total_hip': 16
    };
    
    baseWeeks = conditionTimelines[condition] || baseWeeks;
    
    // Adjust for severity
    const severityMultipliers = {
      'mild': 0.7,
      'moderate': 1.0,
      'severe': 1.4
    };
    
    baseWeeks *= severityMultipliers[severity] || 1.0;
    
    // Adjust for age
    if (age > 65) baseWeeks *= 1.2;
    if (age > 75) baseWeeks *= 1.4;
    if (age < 25) baseWeeks *= 0.8;
    
    // Adjust for comorbidities
    baseWeeks *= (1 + (comorbidities.length * 0.15));
    
    return {
      acute_phase: Math.ceil(baseWeeks * 0.15),      // ~15% of total
      inflammatory_phase: Math.ceil(baseWeeks * 0.25), // ~25% of total
      proliferation_phase: Math.ceil(baseWeeks * 0.35), // ~35% of total
      maturation_phase: Math.ceil(baseWeeks * 0.25),   // ~25% of total
      total_weeks: Math.ceil(baseWeeks)
    };
  }

  calculateProgressMetrics(progressData, baselineMetrics) {
    const metrics = {};
    
    // Pain reduction calculation
    if (progressData.painLevel !== undefined && baselineMetrics.painLevel) {
      metrics.painReduction = Math.round(
        ((baselineMetrics.painLevel - progressData.painLevel) / baselineMetrics.painLevel) * 100
      );
    }
    
    // Functional improvement calculation
    if (progressData.functionalScore !== undefined && baselineMetrics.functionalScore) {
      metrics.functionalImprovement = Math.round(
        ((progressData.functionalScore - baselineMetrics.functionalScore) / 
         (100 - baselineMetrics.functionalScore)) * 100
      );
    }
    
    // Range of motion improvement
    if (progressData.rangeOfMotion && baselineMetrics.rangeOfMotion) {
      metrics.romImprovement = this.calculateROMImprovement(
        progressData.rangeOfMotion,
        baselineMetrics.rangeOfMotion
      );
    }
    
    // Strength improvement
    if (progressData.strengthMetrics && baselineMetrics.strengthMetrics) {
      metrics.strengthImprovement = this.calculateStrengthImprovement(
        progressData.strengthMetrics,
        baselineMetrics.strengthMetrics
      );
    }
    
    // Quality of life improvement
    if (progressData.qualityOfLife !== undefined && baselineMetrics.qualityOfLife) {
      metrics.qolImprovement = Math.round(
        ((progressData.qualityOfLife - baselineMetrics.qualityOfLife) / 
         (10 - baselineMetrics.qualityOfLife)) * 100
      );
    }
    
    return metrics;
  }

  determineRecoveryPhase(progressData, record) {
    const timeElapsed = this.calculateWeeksElapsed(record.startDate);
    const timeline = record.expectedTimeline;
    
    if (timeElapsed <= timeline.acute_phase) {
      return 'acute';
    } else if (timeElapsed <= timeline.acute_phase + timeline.inflammatory_phase) {
      return 'inflammatory';
    } else if (timeElapsed <= timeline.acute_phase + timeline.inflammatory_phase + timeline.proliferation_phase) {
      return 'proliferation';
    } else if (timeElapsed <= timeline.total_weeks) {
      return 'maturation';
    } else {
      return 'maintenance';
    }
  }

  checkMilestoneAchievement(progressUpdate, record) {
    const metrics = progressUpdate.metrics;
    const goals = record.recoveryGoals;
    
    // Check various milestone criteria
    const milestones = [];
    
    if (metrics.painReduction >= 50 && !this.hasMilestone(record, 'pain_50_reduction')) {
      milestones.push({
        type: 'pain_50_reduction',
        achievement: '50% pain reduction achieved',
        timestamp: progressUpdate.timestamp,
        significance: 'major'
      });
    }
    
    if (metrics.functionalImprovement >= 75 && !this.hasMilestone(record, 'functional_75_improvement')) {
      milestones.push({
        type: 'functional_75_improvement',
        achievement: '75% functional improvement achieved',
        timestamp: progressUpdate.timestamp,
        significance: 'major'
      });
    }
    
    if (progressData.returnToWork && !this.hasMilestone(record, 'return_to_work')) {
      milestones.push({
        type: 'return_to_work',
        achievement: 'Successfully returned to work',
        timestamp: progressUpdate.timestamp,
        significance: 'major'
      });
    }
    
    if (progressData.returnToSport && !this.hasMilestone(record, 'return_to_sport')) {
      milestones.push({
        type: 'return_to_sport',
        achievement: 'Successfully returned to sport',
        timestamp: progressUpdate.timestamp,
        significance: 'major'
      });
    }
    
    return milestones.length > 0 ? milestones[0] : null; // Return first milestone
  }

  generateProgressRecommendations(progressUpdate, record) {
    const recommendations = [];
    const metrics = progressUpdate.metrics;
    const phase = progressUpdate.phase;
    
    // Phase-appropriate recommendations
    if (phase === 'acute' && metrics.painReduction < 25) {
      recommendations.push({
        type: 'pain_management',
        priority: 'high',
        recommendation: 'Consider enhanced pain management strategies',
        rationale: 'Slower than expected pain reduction in acute phase'
      });
    }
    
    if (phase === 'proliferation' && metrics.functionalImprovement < 40) {
      recommendations.push({
        type: 'therapy_intensity',
        priority: 'medium',
        recommendation: 'Consider increasing physical therapy intensity',
        rationale: 'Functional gains below expected trajectory'
      });
    }
    
    if (phase === 'maturation' && metrics.strengthImprovement < 70) {
      recommendations.push({
        type: 'strength_focus',
        priority: 'medium',
        recommendation: 'Emphasize strength training in rehabilitation',
        rationale: 'Strength gains lagging behind functional improvements'
      });
    }
    
    // Timeline-based recommendations
    const timeElapsed = this.calculateWeeksElapsed(record.startDate);
    const expectedProgress = timeElapsed / record.expectedTimeline.total_weeks;
    
    if (metrics.functionalImprovement < expectedProgress * 80) {
      recommendations.push({
        type: 'timeline_adjustment',
        priority: 'medium',
        recommendation: 'Consider extending expected timeline',
        rationale: 'Progress slower than typical recovery curve'
      });
    }
    
    return recommendations;
  }

  assessProgressRisk(record) {
    const latest = record.progressUpdates[record.progressUpdates.length - 1];
    if (!latest) return { risk: 'low', reason: 'No progress data available' };
    
    const metrics = latest.metrics;
    const timeElapsed = this.calculateWeeksElapsed(record.startDate);
    
    // High risk indicators
    if (timeElapsed > 8 && metrics.painReduction < 25) {
      return {
        risk: 'high',
        reason: 'Inadequate pain reduction after 8 weeks',
        recommendations: ['Pain management consultation', 'Imaging review', 'Treatment plan revision']
      };
    }
    
    if (timeElapsed > 12 && metrics.functionalImprovement < 50) {
      return {
        risk: 'high',
        reason: 'Poor functional progress after 12 weeks',
        recommendations: ['Comprehensive reassessment', 'Specialist consultation', 'Treatment intensification']
      };
    }
    
    // Medium risk indicators
    if (timeElapsed > 6 && metrics.painReduction < 40) {
      return {
        risk: 'medium',
        reason: 'Slower than expected pain reduction',
        recommendations: ['Pain management optimization', 'Adherence assessment']
      };
    }
    
    return { risk: 'low', reason: 'Recovery progressing within normal parameters' };
  }

  calculateFinalMetrics(record, finalOutcome) {
    const baseline = record.baselineMetrics;
    
    return {
      totalPainReduction: this.calculatePainReduction(baseline.painLevel, finalOutcome.painLevel),
      totalFunctionalImprovement: this.calculateFunctionalImprovement(
        baseline.functionalScore, 
        finalOutcome.functionalScore
      ),
      strengthRecovery: this.calculateStrengthRecovery(
        baseline.strengthMetrics, 
        finalOutcome.strengthMetrics
      ),
      qolImprovement: this.calculateQOLImprovement(
        baseline.qualityOfLife, 
        finalOutcome.qualityOfLife
      ),
      returnToActivity: finalOutcome.returnToActivity || false,
      patientSatisfaction: finalOutcome.patientSatisfaction || 0,
      complications: record.complications.length,
      adherenceRate: finalOutcome.adherenceRate || 0
    };
  }

  analyzeRecoveryOutcome(record, finalMetrics) {
    const goals = record.recoveryGoals;
    const timeline = record.expectedTimeline;
    const actualWeeks = this.calculateWeeksElapsed(record.startDate, record.completionDate);
    
    const analysis = {
      overallSuccess: this.determineOverallSuccess(finalMetrics, goals),
      painGoalAchieved: finalMetrics.totalPainReduction >= goals.painReduction,
      functionalGoalAchieved: finalMetrics.totalFunctionalImprovement >= goals.functionalImprovement,
      timelineAdherence: actualWeeks <= timeline.total_weeks * 1.1,
      complicationFree: finalMetrics.complications === 0,
      highSatisfaction: finalMetrics.patientSatisfaction >= 8,
      returnToActivitySuccess: finalMetrics.returnToActivity,
      benchmarkComparison: this.compareToBenchmarks(finalMetrics),
      successFactors: this.identifySuccessFactors(record, finalMetrics),
      improvementOpportunities: this.identifyImprovementOpportunities(record, finalMetrics)
    };
    
    return analysis;
  }

  // Helper methods
  calculatePainReduction(initial, final) {
    if (!initial || initial === 0) return 0;
    return Math.round(((initial - final) / initial) * 100);
  }

  calculateFunctionalImprovement(initial, final) {
    if (!initial || initial >= 100) return 0;
    return Math.round(((final - initial) / (100 - initial)) * 100);
  }

  calculateWeeksElapsed(startDate, endDate = null) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = new Date(startDate);
    return Math.floor((end - start) / (7 * 24 * 60 * 60 * 1000));
  }

  hasMilestone(record, milestoneType) {
    return record.milestones.some(m => m.type === milestoneType);
  }

  determineOverallSuccess(finalMetrics, goals) {
    let successScore = 0;
    let totalCriteria = 0;
    
    // Pain reduction success
    if (finalMetrics.totalPainReduction >= goals.painReduction) successScore++;
    totalCriteria++;
    
    // Functional improvement success
    if (finalMetrics.totalFunctionalImprovement >= goals.functionalImprovement) successScore++;
    totalCriteria++;
    
    // Patient satisfaction
    if (finalMetrics.patientSatisfaction >= 7) successScore++;
    totalCriteria++;
    
    // Return to activity
    if (finalMetrics.returnToActivity) successScore++;
    totalCriteria++;
    
    // Complication-free recovery
    if (finalMetrics.complications === 0) successScore++;
    totalCriteria++;
    
    return (successScore / totalCriteria) >= 0.6; // 60% threshold for success
  }

  compareToBenchmarks(finalMetrics) {
    const benchmarks = this.benchmarkData;
    
    return {
      painReduction: this.categorizeBenchmark(finalMetrics.totalPainReduction, benchmarks.painReduction),
      functionalImprovement: this.categorizeBenchmark(finalMetrics.totalFunctionalImprovement, benchmarks.functionalImprovement),
      satisfaction: this.categorizeBenchmark(finalMetrics.patientSatisfaction, benchmarks.satisfactionScores)
    };
  }

  categorizeBenchmark(value, benchmark) {
    if (value >= benchmark.excellent) return 'excellent';
    if (value >= benchmark.good) return 'good';
    if (value >= benchmark.fair) return 'fair';
    return 'poor';
  }

  // Additional helper methods for calculations...
  calculateROMImprovement(current, baseline) {
    // Placeholder for ROM improvement calculation
    return 0;
  }

  calculateStrengthImprovement(current, baseline) {
    // Placeholder for strength improvement calculation
    return 0;
  }

  createTimelineTracker(expectedTimeline) {
    return {
      expectedTimeline,
      actualMilestones: [],
      phaseTransitions: [],
      adherenceScore: 100
    };
  }

  updateTimelineTracker(patientId, progressUpdate) {
    const tracker = this.recoveryTimelines.get(patientId);
    if (tracker && progressUpdate.milestoneReached) {
      tracker.actualMilestones.push(progressUpdate.milestoneReached);
    }
  }

  // Statistics and reporting methods
  getRecoveryStatistics() {
    const completedRecords = Array.from(this.patientRecords.values())
      .filter(record => record.status === 'completed');
    
    if (completedRecords.length === 0) {
      return {
        totalPatients: 0,
        message: 'No completed recovery records available'
      };
    }
    
    const successfulRecoveries = completedRecords
      .filter(record => record.outcomeAnalysis?.overallSuccess);
    
    const averagePainReduction = completedRecords
      .reduce((sum, record) => sum + (record.finalMetrics?.totalPainReduction || 0), 0) / completedRecords.length;
    
    const averageFunctionalImprovement = completedRecords
      .reduce((sum, record) => sum + (record.finalMetrics?.totalFunctionalImprovement || 0), 0) / completedRecords.length;
    
    const averageDuration = completedRecords
      .reduce((sum, record) => sum + (record.totalDuration || 0), 0) / completedRecords.length;
    
    return {
      totalPatients: completedRecords.length,
      successRate: Math.round((successfulRecoveries.length / completedRecords.length) * 100),
      averagePainReduction: Math.round(averagePainReduction),
      averageFunctionalImprovement: Math.round(averageFunctionalImprovement),
      averageDuration: Math.round(averageDuration),
      complicationRate: this.calculateComplicationRate(completedRecords),
      patientSatisfaction: this.calculateAverageSatisfaction(completedRecords),
      returnToActivityRate: this.calculateReturnToActivityRate(completedRecords)
    };
  }

  calculateComplicationRate(records) {
    const withComplications = records.filter(r => r.complications.length > 0).length;
    return Math.round((withComplications / records.length) * 100);
  }

  calculateAverageSatisfaction(records) {
    const satisfactionScores = records
      .map(r => r.finalMetrics?.patientSatisfaction)
      .filter(score => score !== undefined);
    
    if (satisfactionScores.length === 0) return 0;
    
    return Math.round(satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length);
  }

  calculateReturnToActivityRate(records) {
    const returnedToActivity = records.filter(r => r.finalMetrics?.returnToActivity).length;
    return Math.round((returnedToActivity / records.length) * 100);
  }
}

export default RecoveryMetrics;