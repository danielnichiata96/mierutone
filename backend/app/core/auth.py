"""JWT authentication for Supabase."""

import logging
import jwt as pyjwt
from jwt import PyJWKClient, PyJWKClientError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

# JWKS client (caches keys automatically)
_jwks_client: PyJWKClient | None = None


class TokenData(BaseModel):
    """Decoded JWT token data."""

    user_id: str
    email: str | None = None
    access_token: str  # Raw JWT for Supabase RLS


def get_jwks_client() -> PyJWKClient:
    """Get or create JWKS client for Supabase."""
    global _jwks_client
    if _jwks_client is None:
        if not settings.supabase_url:
            raise RuntimeError("Supabase URL not configured")
        jwks_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url)
    return _jwks_client


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> TokenData | None:
    """Extract and validate user from JWT token. Returns None if no token."""
    if not credentials:
        return None

    token = credentials.credentials

    # Check the algorithm from token header
    try:
        unverified_header = pyjwt.get_unverified_header(token)
        token_alg = unverified_header.get("alg", "HS256")
    except Exception as e:
        logger.error(f"Could not read JWT header: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
        )

    try:
        if token_alg in {"RS256", "ES256"}:
            if settings.supabase_jwt_public_key:
                verification_key = settings.supabase_jwt_public_key
            else:
                # Get signing key from Supabase JWKS
                jwks_client = get_jwks_client()
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                verification_key = signing_key.key

            payload = pyjwt.decode(
                token,
                verification_key,
                algorithms=[token_alg],
                audience="authenticated",
            )
        else:
            # HS256 with symmetric secret
            payload = pyjwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )

        user_id = payload.get("sub")
        email = payload.get("email")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        return TokenData(
            user_id=user_id,
            email=email,
            access_token=token,
        )
    except pyjwt.InvalidTokenError as e:
        logger.error(f"JWT validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {e}",
        )
    except PyJWKClientError as e:
        logger.error(f"JWKS fetch failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not fetch signing keys",
        )
    except RuntimeError as e:
        logger.error(str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


async def require_auth(
    user: TokenData | None = Depends(get_current_user),
) -> TokenData:
    """Require authentication - raises 401 if not logged in."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user


# Alias for optional auth (returns None if not authenticated)
optional_auth = get_current_user
