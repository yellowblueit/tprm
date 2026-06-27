import { DataCategory, SensitivityLevel } from '../types/vendor.types.js';

export interface DataClassificationDefinition {
  name: string;
  category: DataCategory;
  sensitivityLevel: SensitivityLevel;
  weightPercentage: number;
  description: string;
  sortOrder: number;
}

export const DATA_CLASSIFICATIONS: DataClassificationDefinition[] = [
  // ===== COMPANY DATA TYPES =====
  // Extreme sensitivity
  {
    name: 'Monetary Assets',
    category: DataCategory.COMPANY,
    sensitivityLevel: SensitivityLevel.EXTREME,
    weightPercentage: 100,
    description:
      'Cash and cash equivalents including digital or virtual.',
    sortOrder: 1,
  },
  {
    name: 'Authentication Credentials or Internal Encryption Keys',
    category: DataCategory.COMPANY,
    sensitivityLevel: SensitivityLevel.EXTREME,
    weightPercentage: 100,
    description:
      'Credentials used to secure an account or keys used to protect the most sensitive data in your organization.',
    sortOrder: 2,
  },
  {
    name: 'Financial Reporting',
    category: DataCategory.COMPANY,
    sensitivityLevel: SensitivityLevel.EXTREME,
    weightPercentage: 90,
    description:
      'Information or financial statements that are used to track, analyze and report on business income and the financial assets.',
    sortOrder: 3,
  },
  // Medium sensitivity
  {
    name: 'Insider Information',
    category: DataCategory.COMPANY,
    sensitivityLevel: SensitivityLevel.MEDIUM,
    weightPercentage: 70,
    description:
      'A non-public fact regarding the plans or condition of a publicly traded company that could provide a financial advantage when used to buy or sell shares of that or another company\'s securities.',
    sortOrder: 4,
  },
  {
    name: 'Vulnerabilities',
    category: DataCategory.COMPANY,
    sensitivityLevel: SensitivityLevel.MEDIUM,
    weightPercentage: 60,
    description:
      'Undisclosed information regarding weaknesses which can be exploited by a threat actor.',
    sortOrder: 5,
  },
  {
    name: 'Source Code',
    category: DataCategory.COMPANY,
    sensitivityLevel: SensitivityLevel.MEDIUM,
    weightPercentage: 60,
    description:
      'Any collection of code, possibly with comments, or any fully executable description of a software system owned by your organization.',
    sortOrder: 6,
  },
  {
    name: 'Employee Sensitive PII',
    category: DataCategory.COMPANY,
    sensitivityLevel: SensitivityLevel.MEDIUM,
    weightPercentage: 60,
    description:
      'Employee PII sensitive in nature, typically requiring breach notification in the event of unauthorized disclosure or loss.',
    sortOrder: 7,
  },
  {
    name: 'Proprietary and Confidential Information',
    category: DataCategory.COMPANY,
    sensitivityLevel: SensitivityLevel.MEDIUM,
    weightPercentage: 40,
    description:
      'Information your organization wishes to keep confidential.',
    sortOrder: 8,
  },
  // Low sensitivity
  {
    name: 'Less Sensitive Confidential Information',
    category: DataCategory.COMPANY,
    sensitivityLevel: SensitivityLevel.LOW,
    weightPercentage: 6,
    description:
      'Information owned by your organization and not made publicly available in bulk but routinely shared with partners or customers.',
    sortOrder: 9,
  },
  {
    name: 'Unrestricted Information',
    category: DataCategory.COMPANY,
    sensitivityLevel: SensitivityLevel.LOW,
    weightPercentage: 1,
    description:
      'Information in which the unauthorized disclosure, alteration or destruction of would result in little or no impact.',
    sortOrder: 10,
  },

  // ===== CUSTOMER DATA TYPES =====
  // Extreme sensitivity
  {
    name: 'Sensitive PII',
    category: DataCategory.CUSTOMER,
    sensitivityLevel: SensitivityLevel.EXTREME,
    weightPercentage: 100,
    description:
      'PII which if lost, compromised, or disclosed without authorization, could result in substantial harm or inconvenience to an individual.',
    sortOrder: 11,
  },
  {
    name: 'PHI (Protected Health Information)',
    category: DataCategory.CUSTOMER,
    sensitivityLevel: SensitivityLevel.EXTREME,
    weightPercentage: 100,
    description:
      'Any information about an individual\'s health status, medical conditions, or healthcare services that can be linked to a specific individual.',
    sortOrder: 12,
  },
  {
    name: 'PCI (Payment Card Industry) Data',
    category: DataCategory.CUSTOMER,
    sensitivityLevel: SensitivityLevel.EXTREME,
    weightPercentage: 100,
    description:
      'Card Holder Data (CHD) or information including unique Primary Account Numbers (PANs) that identify the issuer and the particular cardholder account.',
    sortOrder: 13,
  },
  // Medium sensitivity
  {
    name: 'PII and Additional Attributable Information',
    category: DataCategory.CUSTOMER,
    sensitivityLevel: SensitivityLevel.MEDIUM,
    weightPercentage: 60,
    description:
      'PII and any non-PII attributable information that together can put the customer at risk for social engineering.',
    sortOrder: 14,
  },
  {
    name: 'Customer or Partner Proprietary Information',
    category: DataCategory.CUSTOMER,
    sensitivityLevel: SensitivityLevel.MEDIUM,
    weightPercentage: 55,
    description:
      'Information a company wishes to keep confidential that has been entrusted to you by a third party.',
    sortOrder: 15,
  },
  {
    name: 'PII (Personal Identifiable Information)',
    category: DataCategory.CUSTOMER,
    sensitivityLevel: SensitivityLevel.MEDIUM,
    weightPercentage: 50,
    description:
      'Any information that permits the identity of an individual to be reasonably inferred by either direct or indirect means.',
    sortOrder: 16,
  },
  // Low sensitivity
  {
    name: 'Anonymous Customer Data',
    category: DataCategory.CUSTOMER,
    sensitivityLevel: SensitivityLevel.LOW,
    weightPercentage: 1,
    description:
      'Information collected about customers that has been stripped of any personally identifiable information (PII), while still allowing organizations to analyze trends, behaviors, and other insights without compromising personal privacy.',
    sortOrder: 17,
  },
];
