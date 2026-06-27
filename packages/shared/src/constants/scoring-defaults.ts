import type { ScoringMatrixConfig } from '../types/risk.types.js';
import { BusinessCaseType } from '../types/vendor.types.js';
import { BUSINESS_CASES } from './business-cases.js';
import { SECURITY_DOMAINS } from './security-domains.js';

export const DEFAULT_SCORING_MATRIX: ScoringMatrixConfig = {
  businessCaseWeights: Object.fromEntries(
    BUSINESS_CASES.map((bc) => [bc.type, bc.defaultWeight])
  ),
  criticalityWeights: {
    CRITICAL: 1.0,
    HIGH: 0.75,
    MEDIUM: 0.5,
    LOW: 0.25,
  },
  riskLevelThresholds: {
    CRITICAL: 85,
    HIGH: 65,
    MEDIUM: 40,
    LOW: 20,
    MINIMAL: 0,
  },
  domainWeights: Object.fromEntries(
    SECURITY_DOMAINS.map((d) => [d.code, d.defaultWeight])
  ),
  maturityEffectiveness: {
    NOT_ASSESSED: 0,
    INITIAL: 10,
    DEVELOPING: 30,
    DEFINED: 50,
    MANAGED: 75,
    OPTIMIZING: 95,
  },
  impactWeight: 0.6,
  likelihoodWeight: 0.4,
};
