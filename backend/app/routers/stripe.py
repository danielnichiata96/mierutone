"""Stripe payment endpoints."""

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.core.auth import get_current_user, User
from app.core.config import settings

router = APIRouter(prefix="/stripe", tags=["payments"])

# Initialize Stripe
stripe.api_key = settings.stripe_secret_key


class CheckoutSessionResponse(BaseModel):
    """Response for checkout session creation."""
    url: str
    session_id: str


class PortalSessionResponse(BaseModel):
    """Response for customer portal session."""
    url: str


class SubscriptionStatus(BaseModel):
    """Current subscription status."""
    plan: str  # "free" or "pro"
    status: str | None  # "active", "canceled", "past_due", etc.
    current_period_end: int | None
    cancel_at_period_end: bool


@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: Request,
    user: User = Depends(get_current_user),
):
    """Create a Stripe Checkout Session for Pro subscription."""
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=503,
            detail="Stripe is not configured"
        )

    if not settings.stripe_price_id_pro_monthly:
        raise HTTPException(
            status_code=503,
            detail="Pro plan price is not configured"
        )

    try:
        # Check if user already has a Stripe customer ID
        # This would come from Supabase subscription table
        # For now, we'll create a new customer each time
        # TODO: Look up existing customer by user.id in subscriptions table

        checkout_session = stripe.checkout.Session.create(
            customer_email=user.email,
            line_items=[
                {
                    "price": settings.stripe_price_id_pro_monthly,
                    "quantity": 1,
                },
            ],
            mode="subscription",
            success_url=settings.stripe_success_url,
            cancel_url=settings.stripe_cancel_url,
            metadata={
                "user_id": user.id,
            },
            subscription_data={
                "metadata": {
                    "user_id": user.id,
                },
            },
            allow_promotion_codes=True,
        )

        return CheckoutSessionResponse(
            url=checkout_session.url,
            session_id=checkout_session.id,
        )

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create-portal-session", response_model=PortalSessionResponse)
async def create_portal_session(
    user: User = Depends(get_current_user),
):
    """Create a Stripe Customer Portal session for managing subscription."""
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=503,
            detail="Stripe is not configured"
        )

    try:
        # TODO: Get customer_id from subscriptions table by user.id
        # For now, find customer by email
        customers = stripe.Customer.list(email=user.email, limit=1)

        if not customers.data:
            raise HTTPException(
                status_code=404,
                detail="No subscription found for this account"
            )

        customer_id = customers.data[0].id

        portal_session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{settings.stripe_success_url.rsplit('/', 1)[0]}/settings",
        )

        return PortalSessionResponse(url=portal_session.url)

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/subscription-status", response_model=SubscriptionStatus)
async def get_subscription_status(
    user: User = Depends(get_current_user),
):
    """Get the current user's subscription status."""
    if not settings.stripe_secret_key:
        return SubscriptionStatus(
            plan="free",
            status=None,
            current_period_end=None,
            cancel_at_period_end=False,
        )

    try:
        # TODO: Get subscription from Supabase subscriptions table
        # For now, check Stripe directly by email
        customers = stripe.Customer.list(email=user.email, limit=1)

        if not customers.data:
            return SubscriptionStatus(
                plan="free",
                status=None,
                current_period_end=None,
                cancel_at_period_end=False,
            )

        customer_id = customers.data[0].id
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            status="all",
            limit=1,
        )

        if not subscriptions.data:
            return SubscriptionStatus(
                plan="free",
                status=None,
                current_period_end=None,
                cancel_at_period_end=False,
            )

        sub = subscriptions.data[0]
        is_active = sub.status in ("active", "trialing")

        return SubscriptionStatus(
            plan="pro" if is_active else "free",
            status=sub.status,
            current_period_end=sub.current_period_end,
            cancel_at_period_end=sub.cancel_at_period_end,
        )

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    if not settings.stripe_webhook_secret:
        raise HTTPException(
            status_code=503,
            detail="Webhook secret not configured"
        )

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        # Payment successful, provision access
        user_id = data.get("metadata", {}).get("user_id")
        customer_id = data.get("customer")
        subscription_id = data.get("subscription")

        if user_id and subscription_id:
            # TODO: Create/update subscription in Supabase
            # - Insert into subscriptions table
            # - user_id, customer_id, subscription_id, status="active", plan="pro"
            print(f"Checkout completed for user {user_id}, subscription {subscription_id}")

    elif event_type == "customer.subscription.updated":
        # Subscription was updated (upgraded, downgraded, or payment method changed)
        subscription_id = data.get("id")
        status = data.get("status")
        user_id = data.get("metadata", {}).get("user_id")

        if subscription_id:
            # TODO: Update subscription status in Supabase
            print(f"Subscription {subscription_id} updated to {status}")

    elif event_type == "customer.subscription.deleted":
        # Subscription was canceled
        subscription_id = data.get("id")
        user_id = data.get("metadata", {}).get("user_id")

        if subscription_id:
            # TODO: Update subscription status to "canceled" in Supabase
            print(f"Subscription {subscription_id} canceled")

    elif event_type == "invoice.payment_failed":
        # Payment failed
        subscription_id = data.get("subscription")
        customer_id = data.get("customer")

        if subscription_id:
            # TODO: Update subscription status to "past_due" in Supabase
            # Optionally send email to user about failed payment
            print(f"Payment failed for subscription {subscription_id}")

    return {"status": "ok"}
