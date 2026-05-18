#!/usr/bin/env python3
"""
Merge spells from multiple sources (PHB, TCE, XGE) into a single cleaned file.
Removes duplicate spells by name and strips unused fields.
"""

import json
import sys
from pathlib import Path

# Fields that the app actually uses
KEPT_FIELDS = {
    'name',
    'source', 
    'level',
    'school',
    'time',
    'duration',
    'meta',  # needed to extract 'ritual' flag
    'entries',  # needed for description
    'classes',  # needed to determine which classes can use the spell
}

def clean_spell(spell):
    """Keep only the fields the app needs."""
    return {k: v for k, v in spell.items() if k in KEPT_FIELDS}

def merge_spell_files():
    """Merge multiple spell JSON files, skipping duplicates by name."""
    base_path = Path('src/data')
    
    # Load in order: PHB first, then TCE, then XGE
    source_files = [
        ('raw/spells.json', 'PHB'),
        ('spells-tce.json', 'TCE'),
        ('spells-xge.json', 'XGE'),
    ]
    
    seen_names = set()
    all_spells = []
    stats = {
        'loaded': {},
        'duplicates': [],
        'merged': 0
    }
    
    for file_path, source_label in source_files:
        full_path = base_path / file_path
        
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            spells = data.get('spell', [])
            stats['loaded'][source_label] = len(spells)
            
            # Process each spell
            for spell in spells:
                spell_name = spell.get('name')
                
                if spell_name in seen_names:
                    # Track duplicate
                    stats['duplicates'].append({
                        'name': spell_name,
                        'skipped_source': spell.get('source', 'UNKNOWN'),
                        'kept_in': seen_names.get(spell_name, 'unknown')
                    })
                else:
                    # First occurrence - clean and add
                    seen_names.add(spell_name)
                    cleaned = clean_spell(spell)
                    all_spells.append(cleaned)
                    stats['merged'] += 1
                    
        except FileNotFoundError:
            print(f"✗ File not found: {full_path}", file=sys.stderr)
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"✗ JSON parse error in {full_path}: {e}", file=sys.stderr)
            sys.exit(1)
    
    # Write merged file to raw/spells.json
    output_path = base_path / 'raw' / 'spells.json'
    merged_data = {'spell': all_spells}
    
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(merged_data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"✗ Error writing output: {e}", file=sys.stderr)
        sys.exit(1)
    
    return output_path, all_spells, stats

def print_report(output_path, all_spells, stats):
    """Print a detailed merge report."""
    print("✓ Spell merge completed successfully!")
    print()
    print("📊 Source Statistics:")
    for source, count in stats['loaded'].items():
        print(f"  {source}: {count:4d} spells")
    
    print()
    print("📈 Merge Results:")
    print(f"  Total unique spells: {stats['merged']}")
    print(f"  Duplicates skipped:  {len(stats['duplicates'])}")
    print()
    
    if stats['duplicates']:
        print("⚠️  Duplicates found (kept first, skipped reprints):")
        by_name = {}
        for dup in stats['duplicates']:
            key = dup['name']
            by_name[key] = dup['skipped_source']
        
        for name, skipped_source in sorted(by_name.items())[:20]:
            print(f"  • {name} (skipped {skipped_source})")
        
        if len(by_name) > 20:
            print(f"  ... and {len(by_name) - 20} more")
    
    print()
    print(f"💾 Output: {output_path}")
    print(f"  Size: {len(json.dumps(all_spells)) / 1024 / 1024:.2f} MB")

def main():
    try:
        output_path, all_spells, stats = merge_spell_files()
        print_report(output_path, all_spells, stats)
    except Exception as e:
        print(f"✗ Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
