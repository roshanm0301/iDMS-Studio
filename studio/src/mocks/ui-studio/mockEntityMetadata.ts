// UI Studio — Mock Entity Metadata
// Simulates Entity Designer output for UI Studio builders.
// All data is demo-only; not connected to any backend.

import type { MockEntityDefinition } from '../../types/ui-studio/index'

export const MOCK_ENTITIES: MockEntityDefinition[] = [
  {
    id: 'entity-customer',
    entityCode: 'Customer',
    label: 'Customer',
    pluralLabel: 'Customers',
    description: 'Customer master record',
    capabilityFlags: { isHeaderEntity: false, isLineEntity: false, supportsWorkflow: false, supportsAudit: true },
    relationships: [
      { id: 'rel-customer-orders', label: 'Sale Orders', relatedEntityId: 'entity-saleorder', type: 'has_many' },
    ],
    fields: [
      { id: 'f-cust-id', fieldCode: 'id', label: 'Customer ID', fieldType: 'text', isRequired: true, isReadOnly: true, isSystem: true, isComputed: false },
      { id: 'f-cust-name', fieldCode: 'customerName', label: 'Customer Name', fieldType: 'text', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-cust-code', fieldCode: 'customerCode', label: 'Customer Code', fieldType: 'text', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-cust-email', fieldCode: 'email', label: 'Email', fieldType: 'text', isRequired: false, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-cust-phone', fieldCode: 'phone', label: 'Phone', fieldType: 'text', isRequired: false, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-cust-type', fieldCode: 'customerType', label: 'Customer Type', fieldType: 'select', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-cust-branch', fieldCode: 'branchId', label: 'Branch', fieldType: 'entity_ref', isRequired: false, isReadOnly: false, isSystem: false, isComputed: false, referenceEntityId: 'entity-branch' },
      { id: 'f-cust-status', fieldCode: 'status', label: 'Status', fieldType: 'status', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-cust-created', fieldCode: 'createdAt', label: 'Created At', fieldType: 'datetime', isRequired: false, isReadOnly: true, isSystem: true, isComputed: false },
    ],
  },
  {
    id: 'entity-product',
    entityCode: 'Product',
    label: 'Product',
    pluralLabel: 'Products',
    description: 'Product master with pricing and categorisation',
    capabilityFlags: { isHeaderEntity: false, isLineEntity: false, supportsWorkflow: false, supportsAudit: true },
    relationships: [],
    fields: [
      { id: 'f-prod-id', fieldCode: 'id', label: 'Product ID', fieldType: 'text', isRequired: true, isReadOnly: true, isSystem: true, isComputed: false },
      { id: 'f-prod-code', fieldCode: 'productCode', label: 'Product Code', fieldType: 'text', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-prod-name', fieldCode: 'productName', label: 'Product Name', fieldType: 'text', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-prod-category', fieldCode: 'category', label: 'Category', fieldType: 'select', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-prod-uom', fieldCode: 'uom', label: 'Unit of Measure', fieldType: 'select', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-prod-rate', fieldCode: 'rate', label: 'Rate', fieldType: 'currency', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-prod-tax', fieldCode: 'taxPercent', label: 'Tax %', fieldType: 'decimal', isRequired: false, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-prod-status', fieldCode: 'status', label: 'Status', fieldType: 'status', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
    ],
  },
  {
    id: 'entity-saleorder',
    entityCode: 'SaleOrder',
    label: 'Sale Order',
    pluralLabel: 'Sale Orders',
    description: 'Header entity for sales transaction',
    capabilityFlags: { isHeaderEntity: true, isLineEntity: false, supportsWorkflow: true, supportsAudit: true },
    relationships: [
      { id: 'rel-so-lines', label: 'Order Lines', relatedEntityId: 'entity-saleorderline', type: 'has_many' },
      { id: 'rel-so-customer', label: 'Customer', relatedEntityId: 'entity-customer', type: 'belongs_to' },
    ],
    fields: [
      { id: 'f-so-id', fieldCode: 'id', label: 'Order ID', fieldType: 'text', isRequired: true, isReadOnly: true, isSystem: true, isComputed: false },
      { id: 'f-so-number', fieldCode: 'orderNumber', label: 'Order Number', fieldType: 'text', isRequired: true, isReadOnly: true, isSystem: true, isComputed: false },
      { id: 'f-so-date', fieldCode: 'orderDate', label: 'Order Date', fieldType: 'date', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-so-customer', fieldCode: 'customerId', label: 'Customer', fieldType: 'entity_ref', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false, referenceEntityId: 'entity-customer' },
      { id: 'f-so-branch', fieldCode: 'branchId', label: 'Branch', fieldType: 'entity_ref', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false, referenceEntityId: 'entity-branch' },
      { id: 'f-so-salesperson', fieldCode: 'salespersonId', label: 'Salesperson', fieldType: 'entity_ref', isRequired: false, isReadOnly: false, isSystem: false, isComputed: false, referenceEntityId: 'entity-salesperson' },
      { id: 'f-so-paytype', fieldCode: 'paymentType', label: 'Payment Type', fieldType: 'select', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-so-financer', fieldCode: 'financerId', label: 'Financer', fieldType: 'entity_ref', isRequired: false, isReadOnly: false, isSystem: false, isComputed: false, referenceEntityId: 'entity-financer' },
      { id: 'f-so-subtotal', fieldCode: 'subTotal', label: 'Sub Total', fieldType: 'currency', isRequired: false, isReadOnly: true, isSystem: false, isComputed: true },
      { id: 'f-so-tax', fieldCode: 'taxAmount', label: 'Tax Amount', fieldType: 'currency', isRequired: false, isReadOnly: true, isSystem: false, isComputed: true },
      { id: 'f-so-total', fieldCode: 'totalAmount', label: 'Total Amount', fieldType: 'currency', isRequired: false, isReadOnly: true, isSystem: false, isComputed: true },
      { id: 'f-so-status', fieldCode: 'workflowStatus', label: 'Status', fieldType: 'status', isRequired: true, isReadOnly: true, isSystem: true, isComputed: false },
      { id: 'f-so-remarks', fieldCode: 'remarks', label: 'Remarks', fieldType: 'text', isRequired: false, isReadOnly: false, isSystem: false, isComputed: false },
    ],
  },
  {
    id: 'entity-saleorderline',
    entityCode: 'SaleOrderLine',
    label: 'Sale Order Line',
    pluralLabel: 'Sale Order Lines',
    description: 'Line item entity for sale order',
    capabilityFlags: { isHeaderEntity: false, isLineEntity: true, supportsWorkflow: false, supportsAudit: false },
    relationships: [
      { id: 'rel-sol-order', label: 'Sale Order', relatedEntityId: 'entity-saleorder', type: 'belongs_to' },
      { id: 'rel-sol-product', label: 'Product', relatedEntityId: 'entity-product', type: 'belongs_to' },
    ],
    fields: [
      { id: 'f-sol-id', fieldCode: 'id', label: 'Line ID', fieldType: 'text', isRequired: true, isReadOnly: true, isSystem: true, isComputed: false },
      { id: 'f-sol-product', fieldCode: 'productId', label: 'Product', fieldType: 'entity_ref', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false, referenceEntityId: 'entity-product' },
      { id: 'f-sol-qty', fieldCode: 'quantity', label: 'Quantity', fieldType: 'number', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-sol-uom', fieldCode: 'uom', label: 'UOM', fieldType: 'select', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-sol-rate', fieldCode: 'rate', label: 'Rate', fieldType: 'currency', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-sol-disc', fieldCode: 'discountPercent', label: 'Discount %', fieldType: 'decimal', isRequired: false, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-sol-taxpct', fieldCode: 'taxPercent', label: 'Tax %', fieldType: 'decimal', isRequired: false, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-sol-amount', fieldCode: 'amount', label: 'Amount', fieldType: 'currency', isRequired: false, isReadOnly: true, isSystem: false, isComputed: true },
    ],
  },
  {
    id: 'entity-branch',
    entityCode: 'Branch',
    label: 'Branch',
    pluralLabel: 'Branches',
    description: 'Organisational branch or location',
    capabilityFlags: { isHeaderEntity: false, isLineEntity: false, supportsWorkflow: false, supportsAudit: false },
    relationships: [],
    fields: [
      { id: 'f-br-id', fieldCode: 'id', label: 'Branch ID', fieldType: 'text', isRequired: true, isReadOnly: true, isSystem: true, isComputed: false },
      { id: 'f-br-code', fieldCode: 'branchCode', label: 'Branch Code', fieldType: 'text', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-br-name', fieldCode: 'branchName', label: 'Branch Name', fieldType: 'text', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
    ],
  },
  {
    id: 'entity-salesperson',
    entityCode: 'Salesperson',
    label: 'Salesperson',
    pluralLabel: 'Salespersons',
    description: 'Sales team member',
    capabilityFlags: { isHeaderEntity: false, isLineEntity: false, supportsWorkflow: false, supportsAudit: false },
    relationships: [],
    fields: [
      { id: 'f-sp-id', fieldCode: 'id', label: 'Salesperson ID', fieldType: 'text', isRequired: true, isReadOnly: true, isSystem: true, isComputed: false },
      { id: 'f-sp-name', fieldCode: 'name', label: 'Name', fieldType: 'text', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-sp-code', fieldCode: 'code', label: 'Code', fieldType: 'text', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
    ],
  },
  {
    id: 'entity-financer',
    entityCode: 'Financer',
    label: 'Financer',
    pluralLabel: 'Financers',
    description: 'Finance company for loan/EMI payment type',
    capabilityFlags: { isHeaderEntity: false, isLineEntity: false, supportsWorkflow: false, supportsAudit: false },
    relationships: [],
    fields: [
      { id: 'f-fin-id', fieldCode: 'id', label: 'Financer ID', fieldType: 'text', isRequired: true, isReadOnly: true, isSystem: true, isComputed: false },
      { id: 'f-fin-name', fieldCode: 'financerName', label: 'Financer Name', fieldType: 'text', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-fin-code', fieldCode: 'financerCode', label: 'Financer Code', fieldType: 'text', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
    ],
  },
  {
    id: 'entity-taxcharge',
    entityCode: 'TaxCharge',
    label: 'Tax Charge',
    pluralLabel: 'Tax Charges',
    description: 'Tax and charge definition',
    capabilityFlags: { isHeaderEntity: false, isLineEntity: false, supportsWorkflow: false, supportsAudit: false },
    relationships: [],
    fields: [
      { id: 'f-tc-id', fieldCode: 'id', label: 'Tax Charge ID', fieldType: 'text', isRequired: true, isReadOnly: true, isSystem: true, isComputed: false },
      { id: 'f-tc-name', fieldCode: 'name', label: 'Name', fieldType: 'text', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-tc-type', fieldCode: 'chargeType', label: 'Charge Type', fieldType: 'select', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false },
      { id: 'f-tc-percent', fieldCode: 'percent', label: 'Percent', fieldType: 'decimal', isRequired: false, isReadOnly: false, isSystem: false, isComputed: false },
    ],
  },
]

export function getMockEntityById(id: string): MockEntityDefinition | undefined {
  return MOCK_ENTITIES.find(e => e.id === id)
}

export function getMockEntityByCode(code: string): MockEntityDefinition | undefined {
  return MOCK_ENTITIES.find(e => e.entityCode === code)
}
