# Generated by Django 5.2 on 2025-04-19 05:21

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('backendapp', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='gym',
            name='close_time',
        ),
        migrations.RemoveField(
            model_name='gym',
            name='open_time',
        ),
    ]
