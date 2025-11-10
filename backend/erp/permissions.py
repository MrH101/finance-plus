from rest_framework import permissions

class IsAdminOrManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['superadmin', 'employer']

class IsStoreManager(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.role not in ['superadmin', 'employer']:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'store'):
            return obj.store.manager == request.user
        if hasattr(obj, 'department'):
            return obj.department.store.manager == request.user
        return False

class IsAuthenticatedUser(permissions.BasePermission):
    """Basic permission for authenticated users"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

class IsBusinessOwnerOrAdmin(permissions.BasePermission):
    """Permission to check if user owns the business associated with the object"""
    def has_object_permission(self, request, view, obj):
        # Get the business from the object
        business = None
        if hasattr(obj, 'business'):
            business = obj.business
        elif hasattr(obj, 'store') and hasattr(obj.store, 'business'):
            business = obj.store.business
        elif hasattr(obj, 'created_by') and hasattr(obj.created_by, 'business'):
            business = obj.created_by.business
        
        if not business:
            return False
        
        # Check if the user's business matches the object's business
        return request.user.business == business

class BusinessFilterMixin:
    """Mixin to automatically filter querysets based on user's business"""
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # If user is superadmin, they can see all data
        if self.request.user.role == 'superadmin':
            return queryset
        
        # For other users, filter by their business
        if hasattr(self.request.user, 'business') and self.request.user.business:
            # Filter based on the model's business relationship
            if hasattr(queryset.model, 'business'):
                return queryset.filter(business=self.request.user.business)
            elif hasattr(queryset.model, 'store') and hasattr(queryset.model.store.field.related_model, 'business'):
                return queryset.filter(store__business=self.request.user.business)
            elif hasattr(queryset.model, 'created_by') and hasattr(queryset.model.created_by.field.related_model, 'business'):
                return queryset.filter(created_by__business=self.request.user.business)
        
        return queryset.none()
