"""Celery tasks for the news reader."""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name="news.tasks.fetch_news_task")
def fetch_news_task():
    """Run the RSS → translate → save pipeline (scheduled every 6 hours)."""
    from django.core.management import call_command

    call_command("fetch_news", verbosity=0)
    logger.info("news.tasks.fetch_news_task finished")