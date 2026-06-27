import type { ScoringMatrixConfig, RiskLevel, InherentBreakdown, MaturityLevel } from '../types/risk.types.js';
import type { BusinessCaseType, VendorCriticality } from '../types/vendor.types.js';

/**
 * Calculate inherent risk score based on data classifications, business cases, and criticality.
 *
 * InherentRisk = (ImpactScore * impactWeight) + (LikelihoodScore * likelihoodWeight)
 *   ImpactScore = MAX(selectedDataTypeWeights) * CriticalityMultiplier
 *   LikelihoodScore = SUM(selectedBusinessCaseWeights) normalized to 0-100
 */
export function calculateInherentRisk(
  selectedDataTypeWeights: number[],
  selectedBusinessCases: BusinessCaseType[],
  criticality: VendorCriticality,
  matrix: ScoringMatrixConfig
): { score: number; level: RiskLevel; breakdown: InherentBreakdown } {
  // Impact score: highest data sensitivity * criticality
  const dataClassificationScore =
    selectedDataTypeWeights.length > 0
      ? Math.max(...selectedDataTypeWeights)
      : 0;

  const criticalityMultiplier = matrix.criticalityWeights[criticality] ?? 0.5;
  const impactScore = dataClassificationScore * criticalityMultiplier;

  // Likelihood score: sum of business case weights, normalized to 0-100
  const totalBusinessCaseWeight = selectedBusinessCases.reduce((sum, bc) => {
    return sum + (matrix.businessCaseWeights[bc] ?? 0);
  }, 0);

  // Max possible weight is sum of all business case weights
  const maxPossibleWeight = Object.values(matrix.businessCaseWeights).reduce(
    (sum, w) => sum + w,
    0
  );

  const likelihoodScore =
    maxPossibleWeight > 0
      ? (totalBusinessCaseWeight / maxPossibleWeight) * 100
      : 0;

  // Combined inherent risk
  const score =
    impactScore * matrix.impactWeight +
    likelihoodScore * matrix.likelihoodWeight;

  const clampedScore = Math.min(100, Math.max(0, score));

  return {
    score: Math.round(clampedScore * 100) / 100,
    level: scoreToRiskLevel(clampedScore, matrix),
    breakdown: {
      dataClassificationScore,
      criticalityMultiplier,
      businessCaseLikelihoodScore: likelihoodScore,
      impactWeight: matrix.impactWeight,
      likelihoodWeight: matrix.likelihoodWeight,
    },
  };
}

/**
 * Calculate residual risk score based on inherent risk and domain control effectiveness.
 *
 * ResidualRisk = InherentRisk * (1 - OverallControlEffectiveness / 100)
 */
export function calculateResidualRisk(
  inherentRiskScore: number,
  domainAssessments: Array<{
    domainCode: string;
    maturityLevel: MaturityLevel;
    controlEffectiveness?: number | null;
  }>,
  matrix: ScoringMatrixConfig
): { score: number; level: RiskLevel; overallEffectiveness: number } {
  if (domainAssessments.length === 0) {
    return {
      score: inherentRiskScore,
      level: scoreToRiskLevel(inherentRiskScore, matrix),
      overallEffectiveness: 0,
    };
  }

  let weightedSum = 0;
  let totalWeight = 0;

  for (const assessment of domainAssessments) {
    const weight = matrix.domainWeights[assessment.domainCode] ?? 0.05;

    // Use explicit controlEffectiveness if provided, otherwise derive from maturity
    const effectiveness =
      assessment.controlEffectiveness ??
      (matrix.maturityEffectiveness[assessment.maturityLevel] ?? 0);

    weightedSum += effectiveness * weight;
    totalWeight += weight;
  }

  const overallEffectiveness =
    totalWeight > 0 ? weightedSum / totalWeight : 0;

  const score = inherentRiskScore * (1 - overallEffectiveness / 100);
  const clampedScore = Math.min(100, Math.max(0, score));

  return {
    score: Math.round(clampedScore * 100) / 100,
    level: scoreToRiskLevel(clampedScore, matrix),
    overallEffectiveness: Math.round(overallEffectiveness * 100) / 100,
  };
}

/**
 * Convert a numeric risk score to a risk level based on configurable thresholds.
 */
export function scoreToRiskLevel(
  score: number,
  matrix: ScoringMatrixConfig
): RiskLevel {
  const { riskLevelThresholds } = matrix;

  if (score >= (riskLevelThresholds.CRITICAL ?? 85)) return 'CRITICAL' as RiskLevel;
  if (score >= (riskLevelThresholds.HIGH ?? 65)) return 'HIGH' as RiskLevel;
  if (score >= (riskLevelThresholds.MEDIUM ?? 40)) return 'MEDIUM' as RiskLevel;
  if (score >= (riskLevelThresholds.LOW ?? 20)) return 'LOW' as RiskLevel;
  return 'MINIMAL' as RiskLevel;
}

/**
 * Get the color associated with a risk level for UI display.
 */
export function riskLevelColor(level: RiskLevel): string {
  const colors: Record<string, string> = {
    CRITICAL: '#dc2626',
    HIGH: '#ea580c',
    MEDIUM: '#eab308',
    LOW: '#22c55e',
    MINIMAL: '#06b6d4',
  };
  return colors[level] ?? '#6b7280';
}
