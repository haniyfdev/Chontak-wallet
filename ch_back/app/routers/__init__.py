
from .admin import router as admin_router   # 13
from .auth import router as auth_router     # 7
from .avatar import router as avatar_router # 2
from .card import router as card_router     # 5
from .saved_card import router as saved_card_router    # 5
from .transactions import router as transaction_router # 3
from .subscription import router as subscription_router # 2

# all endpoints = 37

all_routers = [
    admin_router,  
    auth_router,
    avatar_router,
    card_router,
    saved_card_router,
    transaction_router,
    subscription_router
]