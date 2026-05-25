# How Finance Should Work

This document explains the finance system in plain language first.

The goal is simple:

- show whether the business is actually making money from trading
- show what real cash came in and went out
- show what value is still tied up in stock and money customers still owe

## The 3 Views

### 1. Trading Profit

This answers:

"Did the business really earn money from business activity?"

This view should care about:

- money earned from sales that counts as business income
- other real operating income
- the cost of goods that left the shelf
- operating expenses like salaries, rent, and utilities

This view should **not** treat owner funding like business earnings.

### 2. Cash Movement

This answers:

"Did real money enter or leave the business account, cash drawer, or hand?"

This view should show:

- customer money received
- owner funding received
- money spent on stock
- money spent on salaries and other operating costs

Cash movement is about actual cash, not paper profit.

### 3. Business Position

This answers:

"What does the business still own, and what is still owed to the business?"

This view should show:

- stock still on hand
- the value of that stock
- money customers still owe

This is different from profit and different from cash.

## The Core Rules

### Owner investment

If the owner puts money into the business:

- cash goes up
- profit does not go up

Why:

The business received money, but it did not earn that money by trading.

### Stock purchase

If the business buys stock:

- cash goes down
- stock value goes up
- profit does not go down immediately

Why:

The money did not disappear. It turned into goods on the shelf.

### Fully paid sale

If a customer buys and pays fully:

- cash goes up now
- business income goes up now
- the cost of the sold goods leaves profit now
- stock value goes down now

Why:

The business both sold the goods and collected the money.

### Part-paid debt sale

If a customer buys and pays only part:

- only the part paid counts as income now
- only the part paid counts as cash in now
- the unpaid balance becomes money the customer still owes
- the full cost of the goods leaves profit now
- stock value goes down now

Why:

The goods already left the shelf, so their cost is already gone.
But only the money already collected should count as income for now.

### Later debt payment collection

If the customer comes back later to pay:

- cash goes up now
- income goes up now
- customer debt goes down

Why:

The business finally received the money that was still outstanding.

### Manual operating income

If someone records income manually for a real business activity like services or commissions:

- cash goes up
- profit goes up

### Manual operating expense

If someone records a real business expense manually:

- cash goes down
- profit goes down

## Event-by-Event Effect Table

| Event | Cash | Profit | Inventory Value | Customer Receivable |
|---|---|---|---|---|
| Owner investment | Goes up | No change | No change | No change |
| Stock purchase | Goes down | No change | Goes up | No change |
| Fully paid sale | Goes up | Goes up, minus goods cost | Goes down | No change |
| Part-paid debt sale | Paid part goes up | Paid part goes up, full goods cost goes down | Goes down | Unpaid part goes up |
| Later debt payment | Goes up | Goes up | No change | Goes down |
| Manual operating income | Goes up | Goes up | No change | No change |
| Manual operating expense | Goes down | Goes down | No change | No change |

## Step-by-Step Examples

### Example 1: Owner funding followed by stock purchase

The owner puts in **N1,000,000**.

- cash: +N1,000,000
- profit: no change

The business then buys stock worth **N600,000**.

- cash: -N600,000
- stock value: +N600,000
- profit: no change

At this point:

- the business is not richer from profit
- the business simply changed cash into stock

### Example 2: Full cash sale

The business sells goods for **N120,000**.
The goods that left the shelf originally cost **N70,000**.

What happens:

- cash: +N120,000
- income: +N120,000
- cost of goods sold: -N70,000
- stock value: -N70,000
- gross profit: **N50,000**

### Example 3: Debt sale with part payment

The business sells goods for **N200,000**.
The customer pays **N50,000** now.
The goods that left the shelf cost **N110,000**.

What happens on the sale date:

- cash: +N50,000
- income: +N50,000
- customer receivable: +N150,000
- cost of goods sold: -N110,000
- stock value: -N110,000

Profit for now:

- income recognised now: N50,000
- cost recognised now: N110,000
- current profit effect: **-N60,000**

This is expected in this model, because only money actually collected counts as income for now.

### Example 4: Later collection of the debt

The same customer later pays the remaining **N150,000**.

What happens then:

- cash: +N150,000
- income: +N150,000
- receivable: -N150,000

Now the business has recognised the rest of the money.

### Example 5: Salary or rent payment

The business pays salary of **N40,000**.

- cash: -N40,000
- profit: -N40,000

This is a real operating cost, so it should reduce both cash and profit.

## What the App Should Show

### Dashboard blocks

The finance dashboard should show 3 main blocks:

1. Trading Performance
   - sales revenue recognised
   - other operating income
   - cost of goods sold
   - operating expenses
   - gross profit
   - net profit

2. Cash Movement
   - cash received
   - cash spent
   - customer collections
   - owner funding
   - stock purchase cash out
   - net cash movement

3. Business Position
   - inventory value on hand
   - units in stock
   - receivables outstanding
   - customers with balances

### Single finance list

The finance list should be one master ledger.

Each row should clearly show:

- what happened
- where it came from
- cash effect
- profit effect
- inventory effect
- receivable effect
- whether the row is editable or read-only

Sensitive cost and inventory-value effects should only be visible to roles that are allowed to see product costs and financial aggregate data.

This list should include:

- owner funding
- stock purchases
- manual operating income
- manual operating expenses
- fully paid POS sales
- debt sale issue events
- debt payment collection events

Manual rows can remain editable.
Operational rows from POS and stock should be read-only and link back to their source records.

### Reports in business language

Reports should stop mixing together cash, profit, and stock value as if they are the same thing.

Reports should read like this:

- trading performance
- cash movement
- business position

If there is an estimate, the report should say so clearly.

The reports hub should also keep saved snapshots so the business can compare what was generated for a past period without recalculating everything in a hidden way.

## Difference From the Old System

The old setup reduced profit as soon as stock was purchased.

That was not ideal because:

- stock purchase is not the same as stock being sold
- the money became inventory, not a true profit loss right away

The new model fixes that by:

- keeping stock purchase out of profit at purchase time
- reducing profit only when the goods leave the shelf
- separating owner funding from business income
- separating cash movement from business profit

## Short Glossary

### Profit

Money the business truly earned after subtracting the real costs that belong to that business activity.

### Cash

Real money in hand, in the till, or in the bank.

### Inventory value

The money value of the goods the business still has on hand.

### Receivable

Money customers still owe the business.

### Debt sale

A sale where the customer does not pay the full amount immediately.

### Operating expense

A normal business running cost like salary, rent, utility, transport, or supplies.

### Owner funding

Money the owner injects into the business. It helps cash, but it is not business profit.

## Technical Appendix

### Canonical event types

- `OWNER_FUNDING_IN`
- `STOCK_PURCHASE`
- `MANUAL_OPERATING_INCOME`
- `MANUAL_OPERATING_EXPENSE`
- `POS_CASH_SALE`
- `POS_DEBT_SALE_ISSUED`
- `POS_DEBT_PAYMENT_COLLECTED`

### Effects tracked on each event

- `cashIn`
- `cashOut`
- `profitIn`
- `profitOut`
- `inventoryValueIn`
- `inventoryValueOut`
- `receivableIncrease`
- `receivableDecrease`

### Important historical note

Cost of goods sold should use the cost stored at the time of each sale.

If an older sale does not have a cost snapshot, the system must use the best available estimate and clearly flag that period as estimated.
