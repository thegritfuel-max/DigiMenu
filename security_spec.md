# Security Specification - Scalora Labs

## Data Invariants
1. Orders must belong to a valid restaurant.
2. Only restaurant admins (listed in `adminUids`) can modify restaurant info, categories, and menu items.
3. Customers can create orders but cannot modify or delete them once created (only admins can change status).
4. Menu items must have a valid `categoryId` within the same restaurant.
5. All IDs must be strictly validated.

## The Dirty Dozen Payloads (Rejection Tests)
1. **Identity Spoofing**: Attempt to create a restaurant with a fake `adminUids` containing the current user.
2. **Resource Poisoning**: Large junk string as `restaurantId`.
3. **Price Manipulation**: Create a menu item with a negative price.
4. **Unauthenticated Order**: Attempt to create an order without being signed in (if we mandate sign-in, though PRD says "scan and open", usually we guest auth).
5. **Admin Lockdown**: Attempt to remove all admins from a restaurant.
6. **Order Tampering**: Update an order's `totalAmount` after it's in "preparing" state.
7. **Category Cross-contamination**: Assign a menu item to a category ID that belongs to a different restaurant.
8. **Ghost Field**: Adding `isVerified: true` to a restaurant doc.
9. **Time Travel**: Setting `createdAt` of an order to the future.
10. **Shadow Update**: Owner changing their own `role` if we had roles.
11. **PII Leak**: Reading all `adminUids` of all restaurants (should be restricted).
12. **Status Skipping**: Moving an order from "pending" directly to "completed" if there's a required flow (though we'll keep it simple).

## Test Runner (Conceptual)
The `firestore.rules.test.ts` would verify these.
