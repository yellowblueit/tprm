import { BusinessCaseType } from '../types/vendor.types.js';

export interface BusinessCaseDefinition {
  type: BusinessCaseType;
  label: string;
  description: string;
  defaultWeight: number;
}

export const BUSINESS_CASES: BusinessCaseDefinition[] = [
  {
    type: BusinessCaseType.AI_SYSTEMS,
    label: 'AI Systems',
    description:
      'Will the vendor develop, deploy, or integrate AI or machine learning systems that may affect your products, operations, customers, or data?',
    defaultWeight: 0.15,
  },
  {
    type: BusinessCaseType.NETWORK_INTEGRATION,
    label: 'Network Integration',
    description:
      "Will your organization's network be directly connected to the vendor's network?",
    defaultWeight: 0.14,
  },
  {
    type: BusinessCaseType.ONSITE_PHYSICAL_ACCESS,
    label: 'On-Site Physical Access',
    description:
      "Will the vendor's personnel physically access your facilities that house IT systems or infrastructure?",
    defaultWeight: 0.10,
  },
  {
    type: BusinessCaseType.PERSONAL_DATA_PRIVACY,
    label: 'Personal Data Privacy',
    description:
      'Will the vendor process, store, or access personal or sensitive personal data on behalf of your organization or its customers?',
    defaultWeight: 0.15,
  },
  {
    type: BusinessCaseType.TECHNOLOGY_PROVIDER,
    label: 'Technology Provider',
    description:
      'Will the vendor develop or supply technology products or services for use by your organization or its customers?',
    defaultWeight: 0.12,
  },
  {
    type: BusinessCaseType.THIRD_PARTY_DATA_HOSTING,
    label: 'Third-Party Data Hosting',
    description:
      "Will your organization's data or equipment containing your data be physically hosted at the vendor's facility?",
    defaultWeight: 0.14,
  },
  {
    type: BusinessCaseType.VENDOR_DATA_PROCESSING,
    label: 'Vendor Data Processing',
    description:
      "Will your organization's data be transmitted, stored, or processed on systems owned or controlled by the vendor?",
    defaultWeight: 0.12,
  },
  {
    type: BusinessCaseType.VENDOR_LOGICAL_ACCESS,
    label: 'Vendor Logical Access',
    description:
      "Will the vendor's personnel require logical access to your organization's computers, networks, or information systems?",
    defaultWeight: 0.08,
  },
];

export const BUSINESS_CASE_MAP = new Map(
  BUSINESS_CASES.map((bc) => [bc.type, bc])
);
