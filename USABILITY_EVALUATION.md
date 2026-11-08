# ITEC 80 Usability Evaluation — RedJr Builders and Construction Supply

## Prototype and purpose
**Prototype:** RedJr Builders and Construction Supply — Web-Based Product Ordering and Inventory Management System  
**Method:** Informal self-test using the browser prototype. This is a proposed evaluation; replace or supplement it with actual observations from classmates/test users before submitting. Do not claim user testing occurred if it has not.

## Test scenario
A customer wants to order construction supplies for store pickup. The administrator must create the order, verify the order confirmation, and check that inventory was updated.

## Task checklist
- [ ] Sign in using the demo credentials.
- [ ] Open Products and search for “Portland Cement”.
- [ ] Add a quantity of cement to the current order.
- [ ] Enter a customer name and choose Store pickup.
- [ ] Review the order and confirm it.
- [ ] Record the displayed order number and total.
- [ ] Open Orders and locate the newly created order.
- [ ] Update the order status to Confirmed.
- [ ] Open Inventory and verify the cement stock decreased.
- [ ] Return to Dashboard and confirm the order appears in recent orders.

## Usability/design issues and improvements

| Issue found or risk | Improvement made/proposed | HCI principle |
|---|---|---|
| Users may be unsure whether a click actually added an item or submitted an order. | Show toast feedback after adding/removing items, status changes, and stock updates; show a dedicated order confirmation with order number and total. | Feedback / Visibility |
| Users could submit an order without a customer name or a delivery address. | Validate required fields and focus the missing field with a clear message before proceeding. | Error prevention |
| Users might order more units than are available. | Disable add-to-order for out-of-stock products and validate quantities against current stock before checkout. | Error prevention / Constraints |
| Users may worry that they will lose their order if they need to correct a detail. | Provide a review step with “Back to edit” and a clear-cart action before confirmation. | User control and freedom |
| Inventory tables can be difficult to scan when stock is low. | Add status badges, reorder levels, low-stock watch, search, and stock filters. | Visibility / Visual hierarchy |
| Users on a phone may not have room for a permanent sidebar. | Use a collapsible mobile navigation and responsive product cards and tables. | Responsive design / Accessibility |
| A duplicate SKU could cause confusion in the product catalog. | Check SKU uniqueness before saving a new product. | Error prevention / Consistency |

## Test result recording sheet
Complete this after actually running the prototype or asking a classmate to try it.

| Task | Completed? | Time / difficulty | Observation |
|---|---|---|---|
| Find a product | ______ | ______ | ______ |
| Add product to order | ______ | ______ | ______ |
| Confirm an order | ______ | ______ | ______ |
| Find order in Orders | ______ | ______ | ______ |
| Update inventory/status | ______ | ______ | ______ |

## Evaluation conclusion
The prototype supports an end-to-end sample order workflow and connects ordering, order tracking, and stock management. It demonstrates consistency, visibility, feedback, user control, error prevention, clear navigation, and visual hierarchy. The evaluation should be updated with real test observations, including any confusion, errors, and changes made after testing.
