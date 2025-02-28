# Generated by Django 5.1.1 on 2024-11-21 21:05

import django.db.models.deletion
from django.db import migrations, models

import sentry.db.models.fields.foreignkey
import sentry.db.models.fields.hybrid_cloud_foreign_key
from sentry.new_migrations.migrations import CheckedMigration


class Migration(CheckedMigration):
    # This flag is used to mark that a migration shouldn't be automatically run in production.
    # This should only be used for operations where it's safe to run the migration after your
    # code has deployed. So this should not be used for most operations that alter the schema
    # of a table.
    # Here are some things that make sense to mark as post deployment:
    # - Large data migrations. Typically we want these to be run manually so that they can be
    #   monitored and not block the deploy for a long period of time while they run.
    # - Adding indexes to large tables. Since this can take a long time, we'd generally prefer to
    #   run this outside deployments so that we don't block them. Note that while adding an index
    #   is a schema change, it's completely safe to run the operation after the code has deployed.
    # Once deployed, run these manually via: https://develop.sentry.dev/database-migrations/#migration-deployment

    is_post_deployment = False

    dependencies = [
        ("sentry", "0792_add_unique_index_apiauthorization"),
        ("workflow_engine", "0013_related_name_conditions_on_dcg"),
    ]

    operations = [
        migrations.AddField(
            model_name="detector",
            name="config",
            field=models.JSONField(db_default={}),
        ),
        migrations.AddField(
            model_name="detector",
            name="created_by_id",
            field=sentry.db.models.fields.hybrid_cloud_foreign_key.HybridCloudForeignKey(
                "sentry.User", db_index=True, null=True, on_delete="SET_NULL"
            ),
        ),
        migrations.AddField(
            model_name="detector",
            name="description",
            field=models.TextField(null=True),
        ),
        migrations.AddField(
            model_name="detector",
            name="enabled",
            field=models.BooleanField(db_default=True),
        ),
        migrations.AddField(
            model_name="detector",
            name="project",
            field=sentry.db.models.fields.foreignkey.FlexibleForeignKey(
                null=True, on_delete=django.db.models.deletion.CASCADE, to="sentry.project"
            ),
        ),
        migrations.AddField(
            model_name="workflow",
            name="config",
            field=models.JSONField(db_default={}),
        ),
        migrations.AddField(
            model_name="workflow",
            name="created_by_id",
            field=sentry.db.models.fields.hybrid_cloud_foreign_key.HybridCloudForeignKey(
                "sentry.User", db_index=True, null=True, on_delete="SET_NULL"
            ),
        ),
        migrations.AddField(
            model_name="workflow",
            name="enabled",
            field=models.BooleanField(db_default=True),
        ),
        migrations.AddField(
            model_name="workflow",
            name="environment",
            field=sentry.db.models.fields.foreignkey.FlexibleForeignKey(
                null=True, on_delete=django.db.models.deletion.CASCADE, to="sentry.environment"
            ),
        ),
        migrations.AddField(
            model_name="workflow",
            name="owner_team",
            field=sentry.db.models.fields.foreignkey.FlexibleForeignKey(
                null=True, on_delete=django.db.models.deletion.SET_NULL, to="sentry.team"
            ),
        ),
        migrations.AddField(
            model_name="workflow",
            name="owner_user_id",
            field=sentry.db.models.fields.hybrid_cloud_foreign_key.HybridCloudForeignKey(
                "sentry.User", db_index=True, null=True, on_delete="SET_NULL"
            ),
        ),
        migrations.AlterField(
            model_name="action",
            name="required",
            field=models.BooleanField(default=False, null=True),
        ),
        migrations.AlterField(
            model_name="detector",
            name="organization",
            field=sentry.db.models.fields.foreignkey.FlexibleForeignKey(
                null=True, on_delete=django.db.models.deletion.CASCADE, to="sentry.organization"
            ),
        ),
        migrations.AlterField(
            model_name="workflow",
            name="when_condition_group",
            field=sentry.db.models.fields.foreignkey.FlexibleForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="workflow_engine.dataconditiongroup",
            ),
        ),
    ]
