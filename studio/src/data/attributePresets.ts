// ============================================================
// Attribute Presets — Platform-defined named field configurations
// Transparent bundles of typeConfig + classification + governance
// that can be applied when adding a field. User sees all settings
// and can override any value after applying.
// ============================================================
import type { FieldTypeCode, DataClassification, FieldGovernance } from '../types/entityDesigner';

export interface AttributePreset {
  presetId: string;
  label: string;
  fieldType: FieldTypeCode;
  owningLayer: 'platform' | 'vertical' | 'tenant';
  description: string;
  appliesTo?: string[]; // domain tags — 'all' matches any entity domain
  typeConfig: Record<string, any>;
  classification: DataClassification;
  governanceOverrides?: Partial<FieldGovernance>;
}

export const PLATFORM_PRESETS: AttributePreset[] = [
  // ── India-specific identity / compliance fields ───────────
  {
    presetId: 'gstin',
    label: 'GSTIN Number',
    fieldType: 'text',
    owningLayer: 'platform',
    description: 'Goods & Services Tax Identification Number — 15-char alphanumeric, state code prefix',
    appliesTo: ['all'],
    typeConfig: {
      maxLength: 15,
      pattern: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
      uppercase: true,
    },
    classification: 'regulated',
    governanceOverrides: { maskInExport: true, apiOutputMasked: false },
  },
  {
    presetId: 'pan_number',
    label: 'PAN Number',
    fieldType: 'text',
    owningLayer: 'platform',
    description: 'Permanent Account Number (Income Tax) — 10-char alphanumeric',
    appliesTo: ['all'],
    typeConfig: {
      maxLength: 10,
      pattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$',
      uppercase: true,
    },
    classification: 'regulated',
    governanceOverrides: { maskInExport: true, apiOutputMasked: true },
  },
  {
    presetId: 'aadhaar',
    label: 'Aadhaar Number',
    fieldType: 'text',
    owningLayer: 'platform',
    description: 'UIDAI Aadhaar — 12-digit national identity number, starts 2–9',
    appliesTo: ['all'],
    typeConfig: {
      maxLength: 12,
      pattern: '^[2-9][0-9]{11}$',
    },
    classification: 'regulated',
    governanceOverrides: { maskInExport: true, apiOutputMasked: true },
  },

  // ── India-specific contact fields ────────────────────────
  {
    presetId: 'indian_mobile',
    label: 'Indian Mobile Number',
    fieldType: 'phone',
    owningLayer: 'platform',
    description: '10-digit Indian mobile — starts 6–9, no country code prefix needed',
    appliesTo: ['all'],
    typeConfig: {
      countryCodeMode: 'fixed',
      defaultCountryCode: '+91',
      minLength: 10,
      maxLength: 10,
      pattern: '^[6-9][0-9]{9}$',
    },
    classification: 'sensitive',
    governanceOverrides: { apiOutputMasked: false },
  },
  {
    presetId: 'indian_pincode',
    label: 'Indian Pincode',
    fieldType: 'text',
    owningLayer: 'platform',
    description: '6-digit India postal code',
    appliesTo: ['all'],
    typeConfig: {
      maxLength: 6,
      pattern: '^[0-9]{6}$',
    },
    classification: 'internal',
  },

  // ── Financial / banking fields ────────────────────────────
  {
    presetId: 'ifsc_code',
    label: 'IFSC Code',
    fieldType: 'text',
    owningLayer: 'platform',
    description: 'Indian Financial System Code — 11 chars, identifies bank branch for NEFT/RTGS',
    appliesTo: ['finance', 'all'],
    typeConfig: {
      maxLength: 11,
      pattern: '^[A-Z]{4}0[A-Z0-9]{6}$',
      uppercase: true,
    },
    classification: 'internal',
  },

  // ── Automotive-specific fields ────────────────────────────
  {
    presetId: 'vin_chassis',
    label: 'VIN / Chassis Number',
    fieldType: 'text',
    owningLayer: 'platform',
    description: 'Vehicle Identification Number — 17-char alphanumeric (ISO 3779)',
    appliesTo: ['automotive'],
    typeConfig: {
      maxLength: 17,
      pattern: '^[A-HJ-NPR-Z0-9]{17}$',
      uppercase: true,
    },
    classification: 'internal',
  },
  {
    presetId: 'vehicle_reg_no',
    label: 'Vehicle Registration Number',
    fieldType: 'text',
    owningLayer: 'platform',
    description: 'India vehicle reg plate — state code + district + sequence (e.g. MH12AB1234)',
    appliesTo: ['automotive'],
    typeConfig: {
      maxLength: 13,
      pattern: '^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$',
      uppercase: true,
    },
    classification: 'internal',
  },
  {
    presetId: 'engine_number',
    label: 'Engine Number',
    fieldType: 'text',
    owningLayer: 'platform',
    description: 'Manufacturer engine serial number — up to 20 chars alphanumeric',
    appliesTo: ['automotive'],
    typeConfig: {
      maxLength: 20,
      pattern: '^[A-Z0-9]+$',
      uppercase: true,
    },
    classification: 'internal',
  },

  // ── Taxation / trade fields ───────────────────────────────
  {
    presetId: 'hsn_code',
    label: 'HSN Code',
    fieldType: 'text',
    owningLayer: 'platform',
    description: 'Harmonised System of Nomenclature — 4 to 8 digit product classification code',
    appliesTo: ['finance', 'all'],
    typeConfig: {
      maxLength: 8,
      pattern: '^[0-9]{4,8}$',
    },
    classification: 'internal',
  },
  {
    presetId: 'sac_code',
    label: 'SAC Code',
    fieldType: 'text',
    owningLayer: 'platform',
    description: 'Services Accounting Code — 6-digit GST service classification code',
    appliesTo: ['finance', 'all'],
    typeConfig: {
      maxLength: 6,
      pattern: '^[0-9]{6}$',
    },
    classification: 'internal',
  },
];
