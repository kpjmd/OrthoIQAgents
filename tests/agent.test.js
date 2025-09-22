import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { BaseAgent } from '../src/agents/base-agent.js';
import { OrthopedicSpecialist } from '../src/agents/orthopedic-specialist.js';
import { TriageAgent } from '../src/agents/triage-agent.js';
import { PainWhispererAgent } from '../src/agents/pain-whisperer-agent.js';
import { MovementDetectiveAgent } from '../src/agents/movement-detective-agent.js';
import { StrengthSageAgent } from '../src/agents/strength-sage-agent.js';
import { MindMenderAgent } from '../src/agents/mind-mender-agent.js';

// Mock the configuration
jest.mock('../src/config/agent-config.js', () => ({
  agentConfig: {
    cdp: {
      apiKeyName: 'test_key',
      privateKey: 'test_private_key'
    },
    claude: {
      apiKey: 'test_claude_key'
    },
    network: {
      id: 'base-sepolia'
    },
    agent: {
      minConfidenceThreshold: 0.7,
      experienceMultiplier: 1.0
    }
  }
}));

// Mock external dependencies
jest.mock('@coinbase/cdp-agentkit-core');
jest.mock('@langchain/anthropic');

describe('BaseAgent', () => {
  let agent;

  beforeEach(() => {
    agent = new BaseAgent('TestAgent', 'testing');
  });

  test('should initialize with correct properties', () => {
    expect(agent.name).toBe('TestAgent');
    expect(agent.specialization).toBe('testing');
    expect(agent.experience).toBe(0);
    expect(agent.tokenBalance).toBe(0);
    expect(agent.agentId).toBeDefined();
    expect(agent.walletAddress).toBeNull();
  });

  test('should calculate confidence correctly', () => {
    const confidence = agent.getConfidence('test_task');
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  test('should update experience', () => {
    const initialExperience = agent.experience;
    agent.updateExperience();
    expect(agent.experience).toBeGreaterThan(initialExperience);
  });

  test('should calculate token rewards correctly', () => {
    const outcome = {
      success: true,
      mdApproval: true,
      userSatisfaction: 9,
      functionalImprovement: true
    };
    
    const tokens = agent.calculateTokenReward(outcome);
    expect(tokens).toBeGreaterThan(0);
  });
});

describe('OrthopedicSpecialist', () => {
  let specialist;

  beforeEach(() => {
    specialist = new OrthopedicSpecialist('TestOrthoSpecialist', 'knee surgery');
  });

  test('should initialize with orthopedic specialization', () => {
    expect(specialist.specialization).toBe('orthopedic medicine');
    expect(specialist.subspecialty).toBe('knee surgery');
    expect(specialist.medicalKnowledge).toBeDefined();
  });

  test('should have medical knowledge structure', () => {
    const knowledge = specialist.medicalKnowledge;
    expect(knowledge.anatomicalSystems).toContain('musculoskeletal');
    expect(knowledge.commonConditions).toContain('fractures');
    expect(knowledge.diagnosticTools).toContain('xray');
    expect(knowledge.treatmentModalities).toContain('surgery');
  });

  test('should calculate confidence with subspecialty bonus', () => {
    const kneeTaskConfidence = specialist.getConfidence('knee surgery analysis');
    const generalTaskConfidence = specialist.getConfidence('general task');
    
    // Knee surgery should have higher confidence due to subspecialty match
    expect(kneeTaskConfidence).toBeGreaterThanOrEqual(generalTaskConfidence);
  });
});

describe('TriageAgent', () => {
  let triageAgent;

  beforeEach(() => {
    triageAgent = new TriageAgent();
  });

  test('should initialize as triage coordinator', () => {
    expect(triageAgent.specialization).toBe('orthopedic medicine');
    expect(triageAgent.subspecialty).toBe('triage and case coordination');
    expect(triageAgent.caseQueue).toBeDefined();
    expect(triageAgent.specialistNetwork).toBeDefined();
  });

  test('should extract urgency level from assessment', () => {
    const emergencyAssessment = 'This is an emergency requiring immediate attention';
    const routineAssessment = 'This is a routine case for follow-up';
    
    expect(triageAgent.extractUrgencyLevel(emergencyAssessment)).toBe('emergency');
    expect(triageAgent.extractUrgencyLevel(routineAssessment)).toBe('routine');
  });

  test('should extract specialist recommendations', () => {
    const assessment = 'Patient has significant pain and movement dysfunction';
    const recommendations = triageAgent.extractSpecialistRecommendations(assessment);
    
    expect(recommendations).toContain('pain_whisperer');
    expect(recommendations).toContain('movement_detective');
  });

  test('should register specialists in network', () => {
    const mockSpecialist = new PainWhispererAgent();
    triageAgent.registerSpecialist('pain_whisperer', mockSpecialist);
    
    expect(triageAgent.specialistNetwork.has('pain_whisperer')).toBe(true);
  });
});

describe('PainWhispererAgent', () => {
  let painAgent;

  beforeEach(() => {
    painAgent = new PainWhispererAgent();
  });

  test('should initialize with pain management specialization', () => {
    expect(painAgent.specialization).toBe('orthopedic medicine');
    expect(painAgent.subspecialty).toBe('pain management and assessment');
    expect(painAgent.painScales).toBeDefined();
  });

  test('should have pain assessment scales', () => {
    const scales = painAgent.painScales;
    expect(scales.numeric).toEqual({ min: 0, max: 10 });
    expect(scales.functional).toContain('mild');
    expect(scales.descriptive).toContain('sharp');
  });

  test('should extract pain score from assessment', () => {
    const assessment = 'Patient reports pain level of 7/10';
    const score = painAgent.extractPainScore(assessment);
    expect(score).toBe(7);
  });

  test('should calculate pain reduction correctly', () => {
    const progressData = {
      initialPain: 8,
      currentPain: 3
    };
    
    const reduction = painAgent.calculatePainReduction(progressData);
    expect(reduction).toBe(63); // 62.5% rounded to 63
  });
});

describe('MovementDetectiveAgent', () => {
  let movementAgent;

  beforeEach(() => {
    movementAgent = new MovementDetectiveAgent();
  });

  test('should initialize with movement analysis specialization', () => {
    expect(movementAgent.specialization).toBe('orthopedic medicine');
    expect(movementAgent.subspecialty).toBe('biomechanics and movement analysis');
    expect(movementAgent.movementPatterns).toBeDefined();
  });

  test('should extract dysfunction patterns', () => {
    const analysis = 'Patient exhibits forward head posture and rounded shoulders';
    const patterns = movementAgent.extractDysfunctionPatterns(analysis);
    
    expect(patterns).toContain('anterior_head_posture');
    expect(patterns).toContain('rounded_shoulders');
  });

  test('should assess movement risk levels', () => {
    const severeAnalysis = 'Severe dysfunction with marked asymmetry';
    const mildAnalysis = 'Mild movement limitations with good overall pattern';
    
    expect(movementAgent.assessMovementRisk(severeAnalysis)).toBe('high');
    expect(movementAgent.assessMovementRisk(mildAnalysis)).toBe('low');
  });
});

describe('StrengthSageAgent', () => {
  let strengthAgent;

  beforeEach(() => {
    strengthAgent = new StrengthSageAgent();
  });

  test('should initialize with functional restoration specialization', () => {
    expect(strengthAgent.specialization).toBe('orthopedic medicine');
    expect(strengthAgent.subspecialty).toBe('functional restoration and rehabilitation');
    expect(strengthAgent.strengthAssessments).toBeDefined();
  });

  test('should extract functional level from assessment', () => {
    const assessment = 'Patient currently at 65% functional level';
    const level = strengthAgent.extractFunctionalLevel(assessment);
    expect(level).toBe(65);
  });

  test('should calculate readiness score', () => {
    const progressData = {
      strengthGains: 85,
      functionalCapacity: 90,
      movementQuality: 95,
      confidence: 9
    };
    
    const readiness = strengthAgent.calculateReadinessScore(progressData);
    expect(readiness).toBe(100);
  });
});

describe('MindMenderAgent', () => {
  let mindAgent;

  beforeEach(() => {
    mindAgent = new MindMenderAgent();
  });

  test('should initialize with psychological specialization', () => {
    expect(mindAgent.specialization).toBe('orthopedic medicine');
    expect(mindAgent.subspecialty).toBe('psychological aspects of recovery');
    expect(mindAgent.psychologicalAssessments).toBeDefined();
  });

  test('should extract psychological risks', () => {
    const assessment = 'Patient shows high catastrophizing and fear avoidance';
    const risks = mindAgent.extractPsychologicalRisks(assessment);
    
    expect(risks).toContain('high_catastrophizing');
    expect(risks).toContain('severe_fear_avoidance');
  });

  test('should assess psychological urgency', () => {
    const severeAssessment = 'Patient has severe depression requiring immediate attention';
    const mildAssessment = 'Patient shows mild anxiety about recovery';
    
    expect(mindAgent.assessPsychologicalUrgency(severeAssessment)).toBe('high');
    expect(mindAgent.assessPsychologicalUrgency(mildAssessment)).toBe('low');
  });

  test('should calculate anxiety reduction', () => {
    const progressData = {
      anxietyScores: {
        initial: 8,
        current: 3
      }
    };
    
    const reduction = mindAgent.calculateAnxietyReduction(progressData);
    expect(reduction).toBe(63); // 62.5% rounded to 63
  });
});

describe('Agent Token Economics', () => {
  let agent;

  beforeEach(() => {
    agent = new BaseAgent('TokenTestAgent');
  });

  test('should calculate complex token rewards', () => {
    const complexOutcome = {
      success: true,
      mdApproval: true,
      userSatisfaction: 9,
      functionalImprovement: true,
      painReduction: 75,
      speedOfResolution: 3,
      collaborationBonus: true
    };
    
    const tokens = agent.calculateTokenReward(complexOutcome);
    expect(tokens).toBeGreaterThan(50); // Should be substantial reward
  });

  test('should handle minimal rewards', () => {
    const minimalOutcome = {
      success: false,
      userSatisfaction: 3
    };
    
    const tokens = agent.calculateTokenReward(minimalOutcome);
    expect(tokens).toBe(1); // Base reward only
  });
});

describe('Agent Collaboration', () => {
  let agent1;
  let agent2;

  beforeEach(() => {
    agent1 = new BaseAgent('Agent1');
    agent2 = new BaseAgent('Agent2');
  });

  test('should record collaboration', () => {
    agent1.recordCollaboration('Agent2', 'consultation');
    
    expect(agent1.collaboratingAgents.has('Agent2')).toBe(true);
    const collaboration = agent1.collaboratingAgents.get('Agent2');
    expect(collaboration.collaborations).toHaveLength(1);
    expect(collaboration.collaborations[0].type).toBe('consultation');
  });

  test('should track multiple collaborations', () => {
    agent1.recordCollaboration('Agent2', 'consultation');
    agent1.recordCollaboration('Agent2', 'second_opinion');
    
    const collaboration = agent1.collaboratingAgents.get('Agent2');
    expect(collaboration.collaborations).toHaveLength(2);
  });
});

describe('System Prompts', () => {
  test('all agents should have comprehensive system prompts', () => {
    const agents = [
      new BaseAgent('Test'),
      new OrthopedicSpecialist('Test'),
      new TriageAgent(),
      new PainWhispererAgent(),
      new MovementDetectiveAgent(),
      new StrengthSageAgent(),
      new MindMenderAgent()
    ];

    agents.forEach(agent => {
      const prompt = agent.getSystemPrompt();
      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(100);
      expect(prompt).toContain(agent.name);
      expect(prompt).toContain('token');
      expect(prompt).toContain('experience');
    });
  });
});

describe('Error Handling', () => {
  test('should handle missing configuration gracefully', () => {
    // This test would check error handling for missing config
    // Implementation depends on how errors are handled in actual code
    expect(() => {
      const agent = new BaseAgent('ErrorTestAgent');
    }).not.toThrow();
  });
});

describe('Performance Metrics', () => {
  test('should track agent statistics', () => {
    const painAgent = new PainWhispererAgent();
    const stats = painAgent.getPainStatistics();
    
    expect(stats).toBeDefined();
    expect(stats.totalAssessments).toBe(0);
    expect(stats.totalManagementPlans).toBe(0);
    expect(stats.tokenBalance).toBe(0);
    expect(stats.experience).toBe(0);
  });

  test('should track movement agent statistics', () => {
    const movementAgent = new MovementDetectiveAgent();
    const stats = movementAgent.getMovementStatistics();
    
    expect(stats).toBeDefined();
    expect(stats.totalAssessments).toBe(0);
    expect(stats.totalCorrectionPlans).toBe(0);
    expect(stats.compensatoryPatterns).toEqual([]);
  });
});