# Frontend rules

- Keep mobile notification overrides in the global stylesheet with explicit shared notification classes; portal content lives outside page wrappers.
- Use constrained native vertical scrolling for recent activity lists; intrinsic table sizing in scroll viewports must not widen mobile rows.
- Storefront appearance modes live in `ShopLayoutContext` and global layout styles; mode-specific product cards stay in the shared product component so purchase behavior remains consistent.
- The private music bucket has no direct read policy; playback must use short-lived URLs issued only for active playlist entries while playback is enabled, with inactive previews restricted to admins.
- Browser purchase RPCs must be authenticated and bind user IDs to `auth.uid()`; legacy `purchase_product` stays revoked, and public activity RPCs mask identities server-side because browser-only masking can be bypassed.