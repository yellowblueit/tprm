export interface ComplianceFrameworkDefinition {
  code: string;
  name: string;
  description: string;
  category: string;
  version?: string;
}

export const COMPLIANCE_FRAMEWORKS: ComplianceFrameworkDefinition[] = [
  // Security frameworks
  {
    code: 'SOC2_TYPE1',
    name: 'SOC 2 Type I',
    description: 'Service Organization Control report evaluating the design of controls at a point in time.',
    category: 'Security',
  },
  {
    code: 'SOC2_TYPE2',
    name: 'SOC 2 Type II',
    description: 'Service Organization Control report evaluating the design and operating effectiveness of controls over a period.',
    category: 'Security',
  },
  {
    code: 'ISO27001',
    name: 'ISO 27001',
    description: 'International standard for information security management systems (ISMS).',
    category: 'Security',
    version: '2022',
  },
  {
    code: 'ISO27701',
    name: 'ISO 27701',
    description: 'Extension to ISO 27001 for privacy information management.',
    category: 'Privacy',
    version: '2019',
  },
  {
    code: 'NIST_CSF',
    name: 'NIST Cybersecurity Framework',
    description: 'Framework for improving critical infrastructure cybersecurity.',
    category: 'Security',
    version: '2.0',
  },
  {
    code: 'NIST_800_53',
    name: 'NIST SP 800-53',
    description: 'Security and privacy controls for federal information systems.',
    category: 'Security',
    version: 'Rev 5',
  },
  {
    code: 'CIS',
    name: 'CIS Controls',
    description: 'Center for Internet Security critical security controls.',
    category: 'Security',
    version: 'v8',
  },
  // Privacy frameworks
  {
    code: 'GDPR',
    name: 'GDPR',
    description: 'General Data Protection Regulation for EU data protection and privacy.',
    category: 'Privacy',
  },
  {
    code: 'CCPA',
    name: 'CCPA/CPRA',
    description: 'California Consumer Privacy Act and California Privacy Rights Act.',
    category: 'Privacy',
  },
  // Industry-specific
  {
    code: 'HIPAA',
    name: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act for protected health information.',
    category: 'Industry',
  },
  {
    code: 'PCI_DSS',
    name: 'PCI DSS',
    description: 'Payment Card Industry Data Security Standard.',
    category: 'Industry',
    version: '4.0',
  },
  {
    code: 'FEDRAMP',
    name: 'FedRAMP',
    description: 'Federal Risk and Authorization Management Program for cloud services.',
    category: 'Government',
  },
  {
    code: 'CMMC',
    name: 'CMMC',
    description: 'Cybersecurity Maturity Model Certification for defense contractors.',
    category: 'Government',
    version: '2.0',
  },
  {
    code: 'SOX',
    name: 'SOX',
    description: 'Sarbanes-Oxley Act for financial reporting and internal controls.',
    category: 'Financial',
  },
  {
    code: 'DORA',
    name: 'DORA',
    description: 'Digital Operational Resilience Act for financial sector in EU.',
    category: 'Financial',
  },
  {
    code: 'HITRUST',
    name: 'HITRUST CSF',
    description: 'Health Information Trust Alliance Common Security Framework.',
    category: 'Industry',
  },
  {
    code: 'CSA_STAR',
    name: 'CSA STAR',
    description: 'Cloud Security Alliance Security Trust Assurance and Risk program.',
    category: 'Security',
  },
  {
    code: 'AICPA_TSC',
    name: 'AICPA Trust Services Criteria',
    description: 'Trust services criteria for security, availability, processing integrity, confidentiality, and privacy.',
    category: 'Security',
  },
];
