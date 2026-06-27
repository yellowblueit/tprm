export interface SecurityDomainDefinition {
  code: string;
  name: string;
  description: string;
  sortOrder: number;
  defaultWeight: number;
}

export const SECURITY_DOMAINS: SecurityDomainDefinition[] = [
  {
    code: 'ISP',
    name: 'Information Security Program',
    description:
      'Overall governance, policies, and organizational structure for information security.',
    sortOrder: 1,
    defaultWeight: 0.08,
  },
  {
    code: 'AC',
    name: 'Access Control',
    description:
      'Management of user access rights, authentication mechanisms, and authorization policies.',
    sortOrder: 2,
    defaultWeight: 0.07,
  },
  {
    code: 'NS',
    name: 'Network Security',
    description:
      'Network architecture, segmentation, firewalls, intrusion detection/prevention systems.',
    sortOrder: 3,
    defaultWeight: 0.06,
  },
  {
    code: 'DP',
    name: 'Data Protection & Privacy',
    description:
      'Data handling practices, privacy controls, data retention, and deletion policies.',
    sortOrder: 4,
    defaultWeight: 0.08,
  },
  {
    code: 'EN',
    name: 'Encryption',
    description:
      'Encryption standards for data at rest, in transit, and key management practices.',
    sortOrder: 5,
    defaultWeight: 0.06,
  },
  {
    code: 'VM',
    name: 'Vulnerability Management',
    description:
      'Vulnerability scanning, patching cadence, and remediation processes.',
    sortOrder: 6,
    defaultWeight: 0.06,
  },
  {
    code: 'IR',
    name: 'Incident Response',
    description:
      'Incident detection, response procedures, communication plans, and post-incident reviews.',
    sortOrder: 7,
    defaultWeight: 0.06,
  },
  {
    code: 'BC',
    name: 'Business Continuity & Disaster Recovery',
    description:
      'Business continuity planning, disaster recovery procedures, and resilience testing.',
    sortOrder: 8,
    defaultWeight: 0.06,
  },
  {
    code: 'CM',
    name: 'Change Management',
    description:
      'Change control processes, approval workflows, and deployment procedures.',
    sortOrder: 9,
    defaultWeight: 0.04,
  },
  {
    code: 'PS',
    name: 'Physical Security',
    description:
      'Physical access controls, facility security, environmental controls.',
    sortOrder: 10,
    defaultWeight: 0.04,
  },
  {
    code: 'HR',
    name: 'Human Resources Security',
    description:
      'Background checks, security awareness training, employee onboarding/offboarding.',
    sortOrder: 11,
    defaultWeight: 0.04,
  },
  {
    code: 'AM',
    name: 'Asset Management',
    description:
      'Hardware and software inventory, asset classification, and lifecycle management.',
    sortOrder: 12,
    defaultWeight: 0.04,
  },
  {
    code: 'CL',
    name: 'Compliance & Legal',
    description:
      'Regulatory compliance, legal requirements, contractual obligations, and audit readiness.',
    sortOrder: 13,
    defaultWeight: 0.05,
  },
  {
    code: 'TP',
    name: 'Third-Party / Subprocessor Management',
    description:
      "Vendor's own third-party risk management practices and subprocessor oversight.",
    sortOrder: 14,
    defaultWeight: 0.05,
  },
  {
    code: 'AS',
    name: 'Application Security',
    description:
      'Secure development lifecycle, code review, application testing (SAST/DAST).',
    sortOrder: 15,
    defaultWeight: 0.06,
  },
  {
    code: 'CS',
    name: 'Cloud Security',
    description:
      'Cloud configuration management, shared responsibility model, cloud-native security controls.',
    sortOrder: 16,
    defaultWeight: 0.06,
  },
  {
    code: 'AI',
    name: 'AI/ML Governance',
    description:
      'AI model governance, bias detection, data quality for ML, responsible AI practices.',
    sortOrder: 17,
    defaultWeight: 0.04,
  },
  {
    code: 'IA',
    name: 'Identity & Access Management',
    description:
      'Identity lifecycle, privileged access management, MFA, SSO, and federation.',
    sortOrder: 18,
    defaultWeight: 0.05,
  },
];

export const SECURITY_DOMAIN_MAP = new Map(
  SECURITY_DOMAINS.map((d) => [d.code, d])
);
