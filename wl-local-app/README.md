# Well Land Local Ops

Local starter application for Well Land operations.

## What it is

- Runs locally on your computer.
- Stores data in `data/db.json`.
- Creates JSON backups in `backups/`.
- Uses only built-in Node.js modules, so a developer can later migrate the data to SQLite, PostgreSQL, Supabase, Airtable, Odoo, ERPNext, or another proper database.

## Run

Double-click `START_WL_LOCAL_APP.cmd` from the main `WL OPS` folder.

Keep the black server window open while using the app. If it is closed, the browser will show a connection error.

Or run:

```powershell
cd "C:\Users\Ali Musthaq\Downloads\WL OPS\wl-local-app"
node server.js
```

Then open:

```text
http://127.0.0.1:8787
```

## If the browser cannot connect

1. Run `START_WL_LOCAL_APP.cmd`.
2. Keep the server window open.
3. Refresh the browser at `http://127.0.0.1:8787`.
4. To check the server, run `wl-local-app/CHECK_SERVER.cmd`.
5. To stop it, close the server window or run `STOP_WL_LOCAL_APP.cmd`.

## Main database tables

- `assets`: heavy equipment registry
- `operators`: operators and assigned asset links
- `assignments`: operator-to-asset assignment history
- `procurement`: phone/text/site requests converted into PR workflow
- `paymentRequests`: requests sent to Antrac Accounts and follow-up status
- `suppliers`: supplier relationship management
- `quotes`: supplier quote comparison
- `purchaseOrders`: PO tracking
- `inventory`: stock after payment/collection/GRN
- `transfers`: GRN and dispatch/transfer to sites or Thilafushi base
- `recovery`: machine recovery actions
- `dailyLogs`: daily command records
