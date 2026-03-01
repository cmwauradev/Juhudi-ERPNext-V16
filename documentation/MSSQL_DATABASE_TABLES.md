# MSSQL Database Tables - Complete Overview

**Database:** TEST_ERP  
**Total Tables:** 133  
**Server:** 85.190.241.118

---

## 📊 Key Tables with Data

### Core Business Tables

| Table | Records | Description | Sync Priority |
|-------|---------|-------------|---------------|
| **Customers** | 860 | Customer master data | ✅ **SYNCED** |
| **Connections** | 860 | Water connections | 🔴 **HIGH** |
| **Invoices** | 632 | Customer invoices | 🔴 **HIGH** |
| **Bills** | 6,106 | Water bills/statements | 🔴 **HIGH** |
| **Payments** | 3,564 | Payment transactions | 🔴 **HIGH** |
| **Meter** | 848 | Meter information | 🟡 **MEDIUM** |
| **Meterreading** | 8,587 | Meter readings | 🟡 **MEDIUM** |
| **Statement** | 9,877 | Account statements | 🟡 **MEDIUM** |

### Financial Tables

| Table | Records | Description |
|-------|---------|-------------|
| **Payments_I** | 149 | Payment details |
| **Chartofaccounts** | 5 | Chart of accounts |
| **Accountcategory** | 5 | Account categories |
| **Accounttype** | 17 | Account types |
| **Journals** | 0 | Journal entries |
| **PaymentAccounts** | 1 | Payment account mapping |

### Operations Tables

| Table | Records | Description |
|-------|---------|-------------|
| **Disconnection** | 0 | Disconnection records |
| **Reconnection** | 0 | Reconnection records |
| **Complaints** | 0 | Customer complaints |
| **Orders** | 0 | Work orders |
| **Requisition** | 0 | Material requisitions |

### Configuration Tables

| Table | Records | Description |
|-------|---------|-------------|
| **Users** | 13 | System users |
| **Tariffs** | 8 | Water tariffs |
| **Zones** | 43 | Geographical zones |
| **Subzone** | 6 | Sub-zones |
| **Scheme** | 1 | Water scheme |

---

## 🎯 Recommended Sync Priority

### Priority 1: CRITICAL (Sync Now) 🔴

These tables contain essential transactional data:

1. **Connections** (860 records)
   - Links customers to meters
   - Essential for billing
   - Fields: ConnectionID, CustomerID, MeterID, Zone, Status, Balance

2. **Bills** (6,106 records)
   - Water billing statements
   - Fields: BillId, ConnectionId, Period, Water, Total, Date

3. **Payments** (3,564 records)
   - Payment transactions
   - Fields: PaymentID, ConnectionID, Amount, Date, Type, Ref

4. **Invoices** (632 records)
   - Already partially synced
   - Fields: InvoiceId, CustomerId, Amount, Date

### Priority 2: IMPORTANT (Sync Soon) 🟡

5. **Meter** (848 records)
   - Meter master data
   - Fields: MeterID, SerialNo, Size, Type, Status

6. **Meterreading** (8,587 records)
   - Historical meter readings
   - Fields: ReadingId, MeterID, Reading, Date

7. **Statement** (9,877 records)
   - Account statements
   - Fields: StatementId, ConnectionId, Date, Balance

### Priority 3: REFERENCE DATA (Sync Later) 🟢

8. **Users** (13 records)
9. **Tariffs** (8 records)
10. **Zones** (43 records)
11. **Walkroutes** (69 records)

---

## 📋 Table Details

### CONNECTIONS Table (860 records)
```
Columns:
- ConnectionID (int)
- CustomerId (int)
- MeterId (int)
- ZoneId (int)
- MasterId (int)
- ConnectionStatus (varchar)
- ApplicationNo (varchar)
- Walk (varchar)
- date (date)
- Metered (bit)
- Lat (float)
- Lon (float)
- Account (varchar)
- Disconnected (bit)
- Terminated (bit)
- Balance (float)
- PlotNo (varchar)
- STDcharge (bit)
```

### BILLS Table (6,106 records)
```
Columns:
- BillId (int)
- ConnectionId (int)
- UserID (int)
- ReadingId (int)
- Period (varchar) - e.g., "January 2024"
- Water (float) - Water charges
- Sewer (float) - Sewer charges
- Mrent (float) - Meter rent
- StdCharge (float) - Standing charge
- Total (float) - Total bill amount
- Date (date) - Bill date
- dueDate (date) - Due date
- SMSSent (bit)
- bf (float) - Brought forward
- cf (float) - Carried forward
```

### PAYMENTS Table (3,564 records)
```
Columns:
- PaymentID (int)
- ConnectionID (int)
- UserID (int)
- ModeID (int) - Payment mode
- BankID (int)
- ChartId (int)
- Ref (varchar) - Reference number
- Cheq (varchar) - Cheque number
- TotalAmount (money)
- iDate (date) - Issue date
- iTime (datetime) - Issue time
- Type (varchar) - Cash/Cheque/M-Pesa/Bank
- isCustomer (varchar)
- TDate (datetime2)
- LedgerAmount (float)
- Customername (varchar)
- IDNO (varchar)
- posted (bit)
```

### METER Table (848 records)
```
Columns:
- MeterID (int)
- CustomerId (int)
- SerialNo (varchar)
- Manufacturer (varchar)
- Size (varchar)
- DatePurchased (date)
- dateTested (date)
- dateInstalled (date)
- InitialReading (float)
- Status (varchar)
- MeterType (varchar)
- Technology (varchar)
```

### METERREADING Table (8,587 records)
```
Columns:
- ReadingId (int)
- MeterID (int)
- UserID (int)
- CurrentReading (float)
- PreviousReading (float)
- Consumption (float)
- Date (date)
- Period (varchar)
- Status (varchar)
```

---

## 🚀 Next Steps - Sync Recommendations

### Phase 1: Core Transactional Data (Now)
```bash
# Sync these tables immediately:
1. Connections  → ERPNext (Custom DocType or Customer link)
2. Bills        → ERPNext Sales Invoice
3. Payments     → ERPNext Payment Entry
```

### Phase 2: Operational Data (This Week)
```bash
4. Meter        → ERPNext Asset/Serial No
5. Meterreading → ERPNext (Custom DocType)
6. Statement    → ERPNext (Custom DocType)
```

### Phase 3: Reference Data (Later)
```bash
7. Users        → ERPNext User
8. Tariffs      → ERPNext Item Price
9. Zones        → ERPNext Territory
```

---

## 💡 ERPNext Mapping Suggestions

### Connections → ERPNext
- **Option 1:** Create custom "Water Connection" DocType
- **Option 2:** Link to Customer with custom fields
- **Recommended:** Custom DocType with link to Customer

### Bills → Sales Invoice
- Map Period to posting_date
- Water, Sewer, Mrent as separate line items
- Link to Connection/Customer

### Payments → Payment Entry
- Map to ERPNext Payment Entry
- Link to Customer and Invoice
- Track payment modes (Cash, Cheque, M-Pesa, Bank)

### Meter → Asset
- Create as Serial No or Asset
- Track meter lifecycle
- Link to Connection

---

## 📝 Empty/Unused Tables

These tables have 0 records (may not need syncing):
- Adjustments, Assessment, Bank, Complaints, Deposits
- Disconnection, Reconnection, Expenses, Journals
- Orders, Requisition, Surcharges, etc.

---

**Generated:** February 28, 2026
**Total Tables:** 133
**Tables with Data:** 25+
**Priority Tables:** 8

