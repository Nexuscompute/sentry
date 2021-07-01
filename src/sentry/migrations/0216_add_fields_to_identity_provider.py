# Generated by Django 1.11.29 on 2021-07-01 09:44

import django.db.models.deletion
from django.db import migrations, models

import bitfield.models
import sentry.db.models.fields.bounded
import sentry.db.models.fields.foreignkey


class Migration(migrations.Migration):
    # This flag is used to mark that a migration shouldn't be automatically run in
    # production. We set this to True for operations that we think are risky and want
    # someone from ops to run manually and monitor.
    # General advice is that if in doubt, mark your migration as `is_dangerous`.
    # Some things you should always mark as dangerous:
    # - Large data migrations. Typically we want these to be run manually by ops so that
    #   they can be monitored. Since data migrations will now hold a transaction open
    #   this is even more important.
    # - Adding columns to highly active tables, even ones that are NULL.
    is_dangerous = False

    # This flag is used to decide whether to run this migration in a transaction or not.
    # By default we prefer to run in a transaction, but for migrations where you want
    # to `CREATE INDEX CONCURRENTLY` this needs to be set to False. Typically you'll
    # want to create an index concurrently when adding one to an existing table.
    # You'll also usually want to set this to `False` if you're writing a data
    # migration, since we don't want the entire migration to run in one long-running
    # transaction.
    atomic = True

    dependencies = [
        ("sentry", "0215_fix_state"),
    ]

    operations = [
        migrations.CreateModel(
            name="IdentityProviderSsoConfig",
            fields=[
                (
                    "id",
                    sentry.db.models.fields.bounded.BoundedBigAutoField(
                        primary_key=True, serialize=False
                    ),
                ),
                (
                    "default_team",
                    sentry.db.models.fields.foreignkey.FlexibleForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="sentry.Team",
                    ),
                ),
                (
                    "default_role",
                    sentry.db.models.fields.bounded.BoundedPositiveIntegerField(default=50),
                ),
                ("default_global_access", models.BooleanField(default=False)),
                (
                    "flags",
                    bitfield.models.BitField(
                        (
                            (
                                "allow_unlinked",
                                "Grant access to members who have not linked SSO accounts.",
                            ),
                            (
                                "scim_enabled",
                                "Enable SCIM for member and team provisioning and syncing",
                            ),
                        ),
                        default=0,
                    ),
                ),
            ],
            options={
                "db_table": "sentry_identityproviderssoconfig",
            },
        ),
        migrations.AddField(
            model_name="identityprovider",
            name="last_sync",
            field=models.DateTimeField(null=True),
        ),
        migrations.AddField(
            model_name="identityproviderssoconfig",
            name="identityprovider",
            field=sentry.db.models.fields.foreignkey.FlexibleForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="sentry.IdentityProvider"
            ),
        ),
        migrations.AddField(
            model_name="identityprovider",
            name="organization",
            field=sentry.db.models.fields.foreignkey.FlexibleForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="sentry.Organization",
            ),
        ),
        migrations.AddField(
            model_name="identityprovider",
            name="authprovider",
            field=sentry.db.models.fields.foreignkey.FlexibleForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="sentry.AuthProvider",
            ),
        ),
    ]
