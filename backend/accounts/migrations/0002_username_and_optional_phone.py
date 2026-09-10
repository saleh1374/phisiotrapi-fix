from django.db import migrations, models


def backfill_usernames(apps, schema_editor):
    """Existing users get username = phone_number so password login keeps working."""
    User = apps.get_model("accounts", "User")
    for user in User.objects.filter(username__isnull=True).iterator():
        if user.phone_number:
            user.username = user.phone_number
            user.save(update_fields=["username"])


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="username",
            field=models.CharField(
                blank=True, max_length=30, null=True, verbose_name="نام کاربری"
            ),
        ),
        migrations.AlterField(
            model_name="user",
            name="phone_number",
            field=models.CharField(
                blank=True,
                max_length=11,
                null=True,
                unique=True,
                verbose_name="شماره موبایل",
            ),
        ),
        migrations.RunPython(backfill_usernames, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="user",
            name="username",
            field=models.CharField(
                blank=True,
                max_length=30,
                null=True,
                unique=True,
                verbose_name="نام کاربری",
            ),
        ),
    ]