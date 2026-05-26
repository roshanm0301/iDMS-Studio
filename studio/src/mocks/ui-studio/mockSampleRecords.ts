// UI Studio — Mock Sample Records
// Demo data records used in preview/runtime renderer context.
// Not connected to any backend; demo-only.

export const MOCK_CUSTOMERS = [
  { id: 'cust-001', customerName: 'Ramesh Motors', customerCode: 'RM001', email: 'ramesh@motors.com', phone: '9876543210', customerType: 'Dealer', status: 'active' },
  { id: 'cust-002', customerName: 'Sunil Enterprises', customerCode: 'SE002', email: 'sunil@enterprises.com', phone: '9123456789', customerType: 'Retail', status: 'active' },
  { id: 'cust-003', customerName: 'Priya Auto Works', customerCode: 'PA003', email: 'priya@autoworks.com', phone: '9988776655', customerType: 'Dealer', status: 'inactive' },
]

export const MOCK_PRODUCTS = [
  { id: 'prod-001', productCode: 'CT125X', productName: 'CT 125X', category: 'Motorcycle', uom: 'NOS', rate: 72500, taxPercent: 18, status: 'active' },
  { id: 'prod-002', productCode: 'PLS125', productName: 'Platina 125', category: 'Motorcycle', uom: 'NOS', rate: 68000, taxPercent: 18, status: 'active' },
  { id: 'prod-003', productCode: 'PUL150', productName: 'Pulsar 150', category: 'Motorcycle', uom: 'NOS', rate: 115000, taxPercent: 28, status: 'active' },
]

export const MOCK_BRANCHES = [
  { id: 'br-001', branchCode: 'MUM', branchName: 'Mumbai Main' },
  { id: 'br-002', branchCode: 'PNE', branchName: 'Pune Central' },
]

export const MOCK_SALESPERSONS = [
  { id: 'sp-001', code: 'SP01', name: 'Akash Sharma' },
  { id: 'sp-002', code: 'SP02', name: 'Divya Nair' },
]

export const MOCK_SALE_ORDERS = [
  {
    id: 'so-001',
    orderNumber: 'SO-2024-0001',
    orderDate: '2024-01-15',
    customerId: 'cust-001',
    branchId: 'br-001',
    salespersonId: 'sp-001',
    paymentType: 'Cash',
    subTotal: 72500,
    taxAmount: 13050,
    totalAmount: 85550,
    workflowStatus: 'Approved',
    remarks: 'Priority delivery',
  },
  {
    id: 'so-002',
    orderNumber: 'SO-2024-0002',
    orderDate: '2024-01-18',
    customerId: 'cust-002',
    branchId: 'br-002',
    salespersonId: 'sp-002',
    paymentType: 'Finance',
    financerId: 'fin-001',
    subTotal: 115000,
    taxAmount: 32200,
    totalAmount: 147200,
    workflowStatus: 'Submitted',
    remarks: '',
  },
]

export const MOCK_SALE_ORDER_LINES = [
  { id: 'sol-001', orderId: 'so-001', productId: 'prod-001', quantity: 1, uom: 'NOS', rate: 72500, discountPercent: 0, taxPercent: 18, amount: 85550 },
  { id: 'sol-002', orderId: 'so-002', productId: 'prod-003', quantity: 1, uom: 'NOS', rate: 115000, discountPercent: 0, taxPercent: 28, amount: 147200 },
]
