"""JWT authentication for Supabase."""

import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


class TokenData(BaseModel):
    """Decoded JWT token data."""

    user_id: str
    email: str | None = None
    access_token: str  # Raw JWT for Supabase RLS


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> TokenData | None:
    """Extract and validate user from JWT token. Returns None if no token."""
    if not credentials:
        logger.warning("No credentials provided")
        return None

    # Debug: log JWT secret length (not the secret itself)
    jwt_secret = settings.supabase_jwt_secret
    logger.info(f"JWT secret configured: {bool(jwt_secret)}, length: {len(jwt_secret) if jwt_secret else 0}")

    # Peek at the token header to see which algorithm is used
    try:
        unverified_header = jwt.get_unverified_header(credentials.credentials)
        token_alg = unverified_header.get('alg', 'HS256')
        logger.info(f"JWT header: alg={token_alg}, typ={unverified_header.get('typ')}")
    except Exception as e:
        logger.error(f"Could not read JWT header: {e}")
        token_alg = 'HS256'

    try:
        # Supabase uses HS256 with a symmetric secret
        payload = jwt.decode(
            credentials.credentials,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id = payload.get("sub")
        email = payload.get("email")
        logger.info(f"JWT decoded successfully for user: {user_id}")

        if user_id is None:
            logger.error("JWT valid but no 'sub' claim found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        return TokenData(
            user_id=user_id,
            email=email,
            access_token=credentials.credentials,
        )
    except JWTError as e:
        logger.error(f"JWT validation failed: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {e}",
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
