# Stripe Inline Checkout Setup Guide

This guide explains how to set up and use the new inline Stripe checkout feature.

## What Changed?

Instead of redirecting users to Stripe's hosted checkout page, the checkout now renders **inline** within your application using a modal.

## Installation

### 1. Install Required Packages

From the `frontend` directory, run:

```bash
cd D:\Credminds\elevate\frontend
pnpm add @stripe/stripe-js @stripe/react-stripe-js --filter web
```

### 2. Add Environment Variable

Add your Stripe publishable key to your environment file:

**For development (.env.local or .env.development):**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

**For production (.env.production):**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
```

> **Note:** You can find your Stripe publishable keys in your [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

## How It Works

### Current Implementation (Iframe Fallback)

The component currently works with your **existing backend** by rendering the Stripe checkout URL in an iframe:

1. User fills out the form and clicks "Buy Now"
2. Backend creates a Stripe Checkout Session and returns `checkout_url`
3. Instead of redirecting (`window.location.href`), the checkout opens in a modal
4. User completes payment within the modal
5. Success/cancel handlers manage the flow

### Recommended Implementation (Embedded Checkout)

For the best user experience, update your backend to use Stripe's Embedded Checkout:

#### Backend Changes Required:

```python
# In your order creation endpoint
import stripe

# Create checkout session with embedded mode
session = stripe.checkout.Session.create(
    ui_mode='embedded',  # This is the key change!
    line_items=[
        {
            'price_data': {
                'currency': 'usd',
                'product_data': {
                    'name': product_name,
                },
                'unit_amount': amount_in_cents,
            },
            'quantity': 1,
        }
    ],
    mode='payment',
    return_url=f'{your_domain}/return?session_id={{CHECKOUT_SESSION_ID}}',
)

# Return the client secret instead of checkout URL
return {
    'client_secret': session.client_secret,
    # You can also include checkout_url as fallback
    'checkout_url': session.url
}
```

#### Benefits of Embedded Mode:
- Better user experience (no iframe limitations)
- Official Stripe integration
- More customization options
- Better mobile support

## Component Structure

### New Component: `StripeCheckout.tsx`

Location: `frontend/apps/web/app/(dashboard)/custom-links/components/StripeCheckout.tsx`

This component handles:
- **Embedded checkout** (if `clientSecret` is provided)
- **Iframe fallback** (if only `checkoutUrl` is provided)
- **Loading states**
- **Success/cancel callbacks**
- **Responsive modal design**

### Updated Component: `CheckoutForm.tsx`

Changes made:
- Added Stripe checkout state management
- Modified `handleBuyNow` to open modal instead of redirecting
- Added success/cancel handlers for the checkout modal
- Integrated `StripeCheckout` component

## Usage

The checkout automatically opens when a user clicks the "Buy Now" button. No additional code changes needed!

### Flow:
1. User clicks "Buy Now" → Form validates
2. Order is created → Backend returns checkout data
3. Modal opens with Stripe checkout
4. User completes payment
5. Success callback handles post-payment actions

## Testing

### Test with Stripe Test Mode:

1. Use test publishable key: `pk_test_...`
2. Use test card numbers:
   - **Success:** `4242 4242 4242 4242`
   - **Decline:** `4000 0000 0000 0002`
   - **3D Secure:** `4000 0025 0000 3155`
   - Any future expiry date, any 3-digit CVC

### Testing the Modal:

1. Navigate to a product with payment enabled
2. Fill out the form
3. Click "Buy Now"
4. Verify the checkout modal opens
5. Test payment with test card
6. Verify success callback works

## Troubleshooting

### Modal doesn't open
- Check browser console for errors
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Ensure backend is returning `checkout_url` or `client_secret`

### Iframe shows "Invalid URL" or CORS errors
- This is expected with iframe fallback for some Stripe configurations
- Recommended: Implement embedded mode on backend

### Payment doesn't complete
- Check Stripe Dashboard for session status
- Verify webhooks are configured (if using them)
- Check browser console for JavaScript errors

## File Reference

**New Files:**
- `frontend/apps/web/app/(dashboard)/custom-links/components/StripeCheckout.tsx`

**Modified Files:**
- `frontend/apps/web/app/(dashboard)/custom-links/components/CheckoutForm.tsx` (lines 8, 66-68, 169-180, 465-499, 747-755)

**Configuration:**
- Environment variable: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Support

For Stripe-specific questions, refer to:
- [Stripe React Documentation](https://stripe.com/docs/stripe-js/react)
- [Stripe Embedded Checkout](https://stripe.com/docs/payments/checkout/embedded)
- [Stripe Test Cards](https://stripe.com/docs/testing)
