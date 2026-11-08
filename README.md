# RedJr Builders and Construction Supply — Point of Sale & Inventory

A browser-based point-of-sale (POS), order, inventory and reporting system built with plain HTML, CSS and JavaScript. No install or build step is needed.

## Run locally
1. Extract the ZIP and keep `index.html`, `styles.css`, `script.js` and the `images/` folder together.
2. Open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari).

## Demo access
- Email: `admin@redjr.test`
- Password: `redjr123`

## What's in the system
- **Point of Sale** – tap products or scan/type a SKU and press Enter, change quantities, apply Senior/PWD (20%) or custom discounts, take payment (Cash with change, GCash, Maya, card, bank transfer), print a receipt, hold and resume sales, and print a Today's summary. Shortcuts: `F2` focus search, `F9` charge.
- **Stock updates automatically** when a sale is completed. Cancelling an order returns its items to inventory.
- **Dashboard** – today's sales, transactions, monthly totals, a **Monthly sales bar graph**, recent orders and an inventory watch list.
- **Inventory** – stock table plus a **Stock levels bar graph** (green = in stock, amber = low, red = out, black mark = reorder level). Switch between quantity and % of reorder level. The graph follows the search and stock filter.
- **Reports** – Monthly sales bar graph (6 or 12 months, sales or number of orders), status breakdown and top products.
- **Products / Orders / History** – the delivery/pickup ordering flow, order status updates, product catalog and activity log remain available.
- CSV export for orders, inventory and history.

## Data and going live
- Data is saved in the browser (`localStorage`) so it **stays after refresh**. It is stored per browser and per device; it is not shared between computers.
- The system ships with sample products and 11 months of **demo sales** so the graphs have data. Open the account menu (top-right avatar):
  - **Reset demo data** restores the samples.
  - **Start fresh (go live)** deletes all sales/orders/history but keeps your products and stock. Do this before recording real sales.
- Prices are treated as **VAT-inclusive (12%)**. Receipts are sales receipts only and are not official BIR receipts.
- Login is still a front-end demo, not secure authentication. For multi-user or multi-device use, a backend and database would be needed.

## Deploy to Vercel
1. Upload the project to a GitHub repository.
2. In Vercel choose **Add New → Project**, import the repo, framework preset **Other**, leave the build command blank, output directory `.`.
3. Deploy. No environment variables are needed.

## Product photographs
The catalog has 45 products across 13 categories. Each product has its own photo, loaded from Wikimedia Commons (the file name is in the `photo` field of each product in `script.js`, section 2). If a photo cannot load (for example, offline), the bundled picture in `images/` is shown instead. Check each Commons file page for license and attribution terms before redistributing the project.
To use your own photo for a product, change its `photo`/`image` value in `script.js`, or paste a photo link when using **Add product**.
