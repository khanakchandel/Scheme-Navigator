import os, sys, json
from pathlib import Path
from collections import Counter

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / 'backend'
FRONTEND_PUBLIC_DATA = ROOT_DIR / 'Frontend-Scheme-Navigator-main' / 'public' / 'data'

FRONTEND_PUBLIC_DATA.mkdir(parents=True, exist_ok=True)

sys.path.insert(0, str(BACKEND_DIR))
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.dev'
db_file = BACKEND_DIR / 'db.sqlite3'
os.environ['DATABASE_URL'] = f'sqlite:///{db_file.as_posix()}'

import django
django.setup()

from schemes.models import Scheme
from schemes.serializers import SchemeSerializer

def export():
    print('Fetching all schemes from database...')
    qs = Scheme.objects.all().order_by('-popular_score', 'name')
    total_count = qs.count()
    print(f'Found {total_count} schemes in database.')

    serializer = SchemeSerializer(qs, many=True)
    schemes_data = serializer.data

    category_counts = Counter(s.get('category') for s in schemes_data if s.get('category'))

    full_output_file = FRONTEND_PUBLIC_DATA / 'schemes.json'
    print(f'Writing complete schemes to {full_output_file}...')
    with open(full_output_file, 'w', encoding='utf-8') as f:
        json.dump(schemes_data, f, separators=(',', ':'), ensure_ascii=False)

    full_size_mb = full_output_file.stat().st_size / (1024 * 1024)
    print(f'Full schemes.json size: {full_size_mb:.2f} MB')

    summary_schemes = []
    for s in schemes_data:
        summary_item = {
            'id': s.get('id'),
            'slug': s.get('slug'),
            'name': s.get('name'),
            'shortName': s.get('shortName'),
            'tagline': s.get('tagline'),
            'category': s.get('category'),
            'level': s.get('level'),
            'coveredStates': s.get('coveredStates'),
            'shortDescription': s.get('shortDescription'),
            'popularScore': s.get('popularScore', 0),
            'tags': s.get('tags', []),
            'benefits': [{'title': b.get('title', ''), 'amountOrValue': b.get('amountOrValue', '')} for b in (s.get('benefits') or [])[:2]],
            'eligibility': s.get('eligibility', {}),
            'verification': s.get('verification', {}),
        }
        summary_schemes.append(summary_item)

    summary_output_file = FRONTEND_PUBLIC_DATA / 'schemes-summary.json'
    print(f'Writing summary catalog to {summary_output_file}...')
    with open(summary_output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'schemes': summary_schemes,
            'categoryCounts': dict(category_counts),
            'total': total_count
        }, f, separators=(',', ':'), ensure_ascii=False)

    summary_size_mb = summary_output_file.stat().st_size / (1024 * 1024)
    print(f'Summary schemes-summary.json size: {summary_size_mb:.2f} MB')
    print('Export completed successfully!')

if __name__ == '__main__':
    export()
