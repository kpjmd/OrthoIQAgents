import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock the logger to prevent actual logging during tests
jest.unstable_mockModule('../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Import after mocking
const { validateScope } = await import('../src/utils/scope-validator.js');

describe('Scope Validator', () => {
  // Store original env value
  let originalEnvValue;

  beforeEach(() => {
    originalEnvValue = process.env.ENABLE_SCOPE_VALIDATION;
    // Ensure validation is enabled for tests
    process.env.ENABLE_SCOPE_VALIDATION = 'true';
  });

  afterEach(() => {
    // Restore original env value
    if (originalEnvValue !== undefined) {
      process.env.ENABLE_SCOPE_VALIDATION = originalEnvValue;
    } else {
      delete process.env.ENABLE_SCOPE_VALIDATION;
    }
  });

  describe('OUT_OF_SCOPE detection', () => {
    test('rejects cardiac queries', () => {
      const result = validateScope('I have heart palpitations');
      expect(result.passToAgent).toBe(false);
      expect(result.category).toBe('out_of_scope');
      expect(result.detectedCategory).toBe('cardiac');
    });

    test('rejects high blood pressure queries', () => {
      const result = validateScope('my high blood pressure is concerning me');
      expect(result.passToAgent).toBe(false);
      expect(result.detectedCategory).toBe('cardiac');
    });

    test('rejects diabetes/endocrine queries', () => {
      const result = validateScope('my blood sugar is high');
      expect(result.passToAgent).toBe(false);
      expect(result.detectedCategory).toBe('endocrine');
    });

    test('rejects thyroid queries', () => {
      const result = validateScope('I think I have a thyroid problem');
      expect(result.passToAgent).toBe(false);
      expect(result.detectedCategory).toBe('endocrine');
    });

    test('rejects skin rash/dermatology queries', () => {
      const result = validateScope('I have a skin rash on my arm');
      expect(result.passToAgent).toBe(false);
      expect(result.detectedCategory).toBe('dermatology');
    });

    test('rejects eczema queries', () => {
      const result = validateScope('my eczema is flaring up');
      expect(result.passToAgent).toBe(false);
      expect(result.detectedCategory).toBe('dermatology');
    });

    test('rejects gastrointestinal queries', () => {
      const result = validateScope('I have stomach pain and nausea');
      expect(result.passToAgent).toBe(false);
      expect(result.detectedCategory).toBe('gastrointestinal');
    });

    test('rejects respiratory queries', () => {
      const result = validateScope('my asthma is getting worse');
      expect(result.passToAgent).toBe(false);
      expect(result.detectedCategory).toBe('respiratory');
    });

    test('rejects standalone mental health queries', () => {
      const result = validateScope('I have bipolar disorder');
      expect(result.passToAgent).toBe(false);
      expect(result.detectedCategory).toBe('mental_health_standalone');
    });

    test('rejects oncology queries', () => {
      const result = validateScope('I am undergoing chemotherapy');
      expect(result.passToAgent).toBe(false);
      expect(result.detectedCategory).toBe('oncology');
    });

    test('rejects infectious disease queries', () => {
      const result = validateScope('I have flu symptoms and fever');
      expect(result.passToAgent).toBe(false);
      expect(result.detectedCategory).toBe('infectious');
    });

    test('rejects pregnancy queries without orthopedic context', () => {
      const result = validateScope('I am pregnant and have morning sickness');
      expect(result.passToAgent).toBe(false);
      expect(result.detectedCategory).toBe('pregnancy');
    });

    test('rejects dental queries', () => {
      const result = validateScope('I have a toothache');
      expect(result.passToAgent).toBe(false);
      expect(result.detectedCategory).toBe('dental');
    });

    test('rejects neurological queries', () => {
      const result = validateScope('I have been having seizures');
      expect(result.passToAgent).toBe(false);
      expect(result.detectedCategory).toBe('neurological');
    });
  });

  describe('IN_SCOPE_AFFIRMER protection', () => {
    test('passes shoulder pain queries', () => {
      const result = validateScope('my shoulder hurts after tennis');
      expect(result.passToAgent).toBe(true);
      expect(result.category).toBe('in_scope');
    });

    test('passes knee pain queries', () => {
      const result = validateScope('I have knee pain when running');
      expect(result.passToAgent).toBe(true);
    });

    test('passes back pain queries', () => {
      const result = validateScope('I have lower back pain');
      expect(result.passToAgent).toBe(true);
    });

    test('passes chest wall pain (not cardiac)', () => {
      const result = validateScope('I have chest wall pain after coughing');
      expect(result.passToAgent).toBe(true);
    });

    test('passes rib pain (not cardiac)', () => {
      const result = validateScope('my rib hurts when I breathe');
      expect(result.passToAgent).toBe(true);
    });

    test('passes costochondritis (not cardiac)', () => {
      const result = validateScope('I think I have costochondritis');
      expect(result.passToAgent).toBe(true);
    });

    test('passes TMJ (not dental)', () => {
      const result = validateScope('I have tmj pain when chewing');
      expect(result.passToAgent).toBe(true);
    });

    test('passes temporomandibular joint issues', () => {
      const result = validateScope('temporomandibular joint dysfunction');
      expect(result.passToAgent).toBe(true);
    });

    test('passes surgery anxiety (not standalone mental health)', () => {
      const result = validateScope('I have anxiety about my knee surgery');
      expect(result.passToAgent).toBe(true);
    });

    test('passes performance anxiety in sports context', () => {
      const result = validateScope('performance anxiety about return to sport after injury');
      expect(result.passToAgent).toBe(true);
    });

    test('passes cervicogenic headache (not neurological)', () => {
      const result = validateScope('I have a headache from neck pain');
      expect(result.passToAgent).toBe(true);
    });

    test('passes whiplash with headache', () => {
      const result = validateScope('headache after whiplash injury');
      expect(result.passToAgent).toBe(true);
    });

    test('passes rotator cuff queries', () => {
      const result = validateScope('I think I tore my rotator cuff');
      expect(result.passToAgent).toBe(true);
    });

    test('passes ACL injury queries', () => {
      const result = validateScope('I injured my ACL playing basketball');
      expect(result.passToAgent).toBe(true);
    });

    test('passes meniscus queries', () => {
      const result = validateScope('possible meniscus tear in my knee');
      expect(result.passToAgent).toBe(true);
    });

    test('passes post-surgery queries', () => {
      const result = validateScope('recovery after hip replacement surgery');
      expect(result.passToAgent).toBe(true);
    });

    test('passes physical therapy queries', () => {
      const result = validateScope('physical therapy exercises for my shoulder');
      expect(result.passToAgent).toBe(true);
    });

    test('passes return to sport queries', () => {
      const result = validateScope('when can I return to sport after ankle sprain');
      expect(result.passToAgent).toBe(true);
    });
  });

  describe('Exclusion patterns', () => {
    test('passes pregnancy with pelvic pain', () => {
      const result = validateScope('I am pregnant and have pelvic pain');
      expect(result.passToAgent).toBe(true);
    });

    test('passes pregnancy with back pain', () => {
      const result = validateScope('pregnant with severe back pain');
      expect(result.passToAgent).toBe(true);
    });

    test('passes pregnancy with sciatica', () => {
      const result = validateScope('sciatica during pregnancy');
      expect(result.passToAgent).toBe(true);
    });

    test('passes infection with joint involvement', () => {
      const result = validateScope('possible joint infection in my knee');
      expect(result.passToAgent).toBe(true);
    });

    test('passes septic arthritis queries', () => {
      const result = validateScope('I think I have septic arthritis');
      expect(result.passToAgent).toBe(true);
    });

    test('passes osteomyelitis queries', () => {
      const result = validateScope('suspected osteomyelitis in my foot');
      expect(result.passToAgent).toBe(true);
    });

    test('passes GI with abdominal muscle context', () => {
      const result = validateScope('abdominal muscle strain causing nausea');
      expect(result.passToAgent).toBe(true);
    });

    test('passes core injury with GI symptoms', () => {
      const result = validateScope('core injury with some stomach pain');
      expect(result.passToAgent).toBe(true);
    });

    test('passes bone cancer queries (orthopedic oncology)', () => {
      const result = validateScope('bone cancer in my femur');
      expect(result.passToAgent).toBe(true);
    });

    test('passes osteosarcoma queries', () => {
      const result = validateScope('recovering from osteosarcoma treatment');
      expect(result.passToAgent).toBe(true);
    });

    test('passes mental health with injury context', () => {
      const result = validateScope('depression diagnosis affecting my injury recovery');
      expect(result.passToAgent).toBe(true);
    });

    test('passes mental health with rehabilitation context', () => {
      const result = validateScope('panic disorder but need help with rehabilitation');
      expect(result.passToAgent).toBe(true);
    });
  });

  describe('Default pass behavior (err on inclusion)', () => {
    test('passes plantar fasciitis', () => {
      const result = validateScope('plantar fasciitis in left foot');
      expect(result.passToAgent).toBe(true);
    });

    test('passes IT band syndrome', () => {
      const result = validateScope('IT band pain when running');
      expect(result.passToAgent).toBe(true);
    });

    test('passes ambiguous queries', () => {
      const result = validateScope('my leg feels weird');
      expect(result.passToAgent).toBe(true);
    });

    test('passes empty query', () => {
      const result = validateScope('');
      expect(result.passToAgent).toBe(true);
    });

    test('passes null query', () => {
      const result = validateScope(null);
      expect(result.passToAgent).toBe(true);
    });

    test('passes undefined query', () => {
      const result = validateScope(undefined);
      expect(result.passToAgent).toBe(true);
    });

    test('passes generic sports injury', () => {
      const result = validateScope('I got hurt playing soccer');
      expect(result.passToAgent).toBe(true);
    });
  });

  describe('Case data integration', () => {
    test('uses caseData.symptoms for validation', () => {
      const result = validateScope('', { symptoms: 'heart palpitations' });
      expect(result.passToAgent).toBe(false);
      expect(result.detectedCategory).toBe('cardiac');
    });

    test('uses caseData.primaryComplaint for validation', () => {
      const result = validateScope('', { primaryComplaint: 'knee pain' });
      expect(result.passToAgent).toBe(true);
    });

    test('uses caseData.rawQuery for validation', () => {
      const result = validateScope('', { rawQuery: 'shoulder injury' });
      expect(result.passToAgent).toBe(true);
    });

    test('combines query and caseData for validation', () => {
      // Query alone wouldn't trigger out-of-scope
      // But combined with caseData symptoms, it should
      const result = validateScope('help me', { symptoms: 'diabetes blood sugar concerns' });
      expect(result.passToAgent).toBe(false);
      expect(result.detectedCategory).toBe('endocrine');
    });
  });

  describe('Environment variable toggle', () => {
    test('bypasses validation when ENABLE_SCOPE_VALIDATION is false', () => {
      process.env.ENABLE_SCOPE_VALIDATION = 'false';
      const result = validateScope('I have heart palpitations');
      expect(result.passToAgent).toBe(true);
      expect(result.category).toBe('in_scope');
    });

    test('validation enabled by default when env not set', () => {
      delete process.env.ENABLE_SCOPE_VALIDATION;
      const result = validateScope('I have heart palpitations');
      // When env is not set, validation is enabled (default true)
      expect(result.passToAgent).toBe(false);
    });

    test('validation enabled when env is true', () => {
      process.env.ENABLE_SCOPE_VALIDATION = 'true';
      const result = validateScope('I have heart palpitations');
      expect(result.passToAgent).toBe(false);
    });
  });

  describe('Redirect message structure', () => {
    test('returns proper message structure for cardiac', () => {
      const result = validateScope('heart disease symptoms');
      expect(result.redirectMessage).toBeDefined();
      expect(result.redirectMessage.title).toBe('Heart-Related Concerns');
      expect(result.redirectMessage.message).toContain('musculoskeletal');
      expect(result.redirectMessage.suggestion).toContain('cardiologist');
    });

    test('returns proper message structure for endocrine', () => {
      const result = validateScope('diabetes management');
      expect(result.redirectMessage).toBeDefined();
      expect(result.redirectMessage.title).toBe('Metabolic/Endocrine Concerns');
    });

    test('returns proper message structure for dermatology', () => {
      const result = validateScope('psoriasis treatment');
      expect(result.redirectMessage).toBeDefined();
      expect(result.redirectMessage.title).toBe('Skin Condition Detected');
    });

    test('returns proper message structure for mental health', () => {
      const result = validateScope('schizophrenia symptoms');
      expect(result.redirectMessage).toBeDefined();
      expect(result.redirectMessage.title).toBe('Mental Health Support');
    });

    test('returns null redirectMessage for in-scope queries', () => {
      const result = validateScope('knee pain');
      expect(result.redirectMessage).toBeNull();
    });
  });

  describe('Confidence scores', () => {
    test('returns high confidence for affirmer matches', () => {
      const result = validateScope('shoulder pain');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    test('returns high confidence for out-of-scope matches', () => {
      const result = validateScope('heart palpitations');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    test('returns medium confidence for default pass', () => {
      const result = validateScope('something vague');
      expect(result.confidence).toBe(0.5);
    });
  });

  describe('Matched terms tracking', () => {
    test('tracks matched affirmer terms', () => {
      const result = validateScope('shoulder pain after playing tennis');
      expect(result.matchedTerms).toBeDefined();
      expect(result.matchedTerms.length).toBeGreaterThan(0);
    });

    test('tracks matched out-of-scope terms', () => {
      const result = validateScope('I have heart palpitations');
      expect(result.matchedTerms).toBeDefined();
      expect(result.matchedTerms).toContain('heart palpitations');
    });

    test('returns empty array for default pass', () => {
      const result = validateScope('something vague');
      expect(result.matchedTerms).toEqual([]);
    });
  });
});
