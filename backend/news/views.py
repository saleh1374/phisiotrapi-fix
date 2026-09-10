from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import NewsFeed
from .serializers import NewsFeedSerializer, NewsFeedWriteSerializer


class NewsListView(generics.ListAPIView):
    """Published articles with category filter and search."""

    permission_classes = [permissions.AllowAny]
    serializer_class = NewsFeedSerializer

    def get_queryset(self):
        qs = NewsFeed.objects.filter(is_published=True)
        category = self.request.query_params.get("category")
        search = self.request.query_params.get("search")
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(Q(title_fa__icontains=search) | Q(summary_fa__icontains=search))
        return qs


class NewsDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = NewsFeedSerializer
    queryset = NewsFeed.objects.filter(is_published=True)


class NewsCreateView(generics.CreateAPIView):
    """Create a news article manually (admin/author)."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NewsFeedWriteSerializer

    def perform_create(self, serializer):
        if not (self.request.user.is_admin_user or self.request.user.role == "author"):
            self.permission_denied(self.request)
        serializer.save()


class NewsModerationListView(generics.ListAPIView):
    """Pending articles for admin review (unpublished drafts)."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NewsFeedSerializer

    def get_queryset(self):
        if not (self.request.user.is_admin_user or self.request.user.role == "author"):
            return NewsFeed.objects.none()
        return NewsFeed.objects.filter(is_published=False)


class NewsModerationView(APIView):
    """Publish / unpublish / edit a draft (admin/author)."""

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not (request.user.is_admin_user or request.user.role == "author"):
            return Response({"detail": "دسترسی ندارید"}, status=status.HTTP_403_FORBIDDEN)
        article = NewsFeed.objects.filter(pk=pk).first()
        if article is None:
            return Response({"detail": "خبر یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
        serializer = NewsFeedWriteSerializer(article, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(NewsFeedSerializer(article).data)