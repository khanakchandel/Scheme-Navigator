"""
Management command: import_schemes

Usage:
    python manage.py import_schemes
    python manage.py import_schemes --dry-run
"""
from django.conf import settings
from django.core.cache import cache
from django.core.management.base import BaseCommand, CommandError

from schemes.datasources import get_datasource
from schemes.models import Scheme


class Command(BaseCommand):
    help = "Import or sync schemes from live Government API (APIMitra / MyScheme)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--url",
            type=str,
            default="",
            help="Government API URL (defaults to GOVT_SCHEME_API_URL from settings/.env)",
        )
        parser.add_argument(
            "--api-key",
            type=str,
            default="",
            help="Government API Key / Bearer token (defaults to GOVT_SCHEME_API_KEY from settings/.env)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Parse and validate without writing to the database",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        url = options["url"] or getattr(settings, "GOVT_SCHEME_API_URL", "")
        api_key = options["api_key"] or getattr(settings, "GOVT_SCHEME_API_KEY", "")
        if not url:
            raise CommandError(
                "Government API URL is required. Provide --url or set GOVT_SCHEME_API_URL in .env"
            )
        source_kwargs = {"url": url, "api_key": api_key}

        self.stdout.write("Using source: Government API (APIMitra / MyScheme)")
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — no database writes."))

        try:
            datasource = get_datasource("api", **source_kwargs)
            raw_schemes = datasource.fetch_schemes()
        except (FileNotFoundError, NotImplementedError, ValueError) as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(f"Fetched {len(raw_schemes)} scheme(s) from source.")

        inserted = updated = skipped = 0

        for data in raw_schemes:
            slug = data.get("slug", "").strip()
            if not slug:
                skipped += 1
                continue

            # Validate required fields
            if not data.get("name") or not data.get("category"):
                self.stderr.write(
                    self.style.WARNING(f"Skipping '{slug}': missing name or category.")
                )
                skipped += 1
                continue

            if dry_run:
                self.stdout.write(f"  [dry-run] Would upsert: {slug}")
                continue

            defaults = {k: v for k, v in data.items() if k != "slug"}

            _, created = Scheme.objects.update_or_create(
                slug=slug,
                defaults=defaults,
            )
            if created:
                inserted += 1
            else:
                updated += 1

        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Done. Inserted: {inserted} | Updated: {updated} | Skipped: {skipped}"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Dry run complete. Would process: {len(raw_schemes)} record(s)."
                )
            )
