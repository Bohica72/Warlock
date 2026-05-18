#!/usr/bin/env python3
"""
Clean up spells.json by removing unused fields.
Keeps only the fields that are actually accessed by the app.
"""

import json
import sys

# Fields that the app actually uses (from DataLoader.js parseSpells function)
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

def main():
    input_file = 'src/data/raw/spells.json'
    output_file = 'src/data/spells.json'
    
    try:
        # Load the raw spells data
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Clean each spell
        original_count = len(data.get('spell', []))
        cleaned_spells = [clean_spell(spell) for spell in data.get('spell', [])]
        
        # Create the cleaned data structure
        cleaned_data = {'spell': cleaned_spells}
        
        # Write the cleaned data
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(cleaned_data, f, indent=2, ensure_ascii=False)
        
        # Calculate size reduction
        with open(input_file, 'r', encoding='utf-8') as f:
            original_size = len(f.read())
        with open(output_file, 'r', encoding='utf-8') as f:
            cleaned_size = len(f.read())
        
        reduction = (original_size - cleaned_size) / original_size * 100
        
        print(f"✓ Successfully cleaned spells.json")
        print(f"  Spells: {original_count}")
        print(f"  Original size: {original_size / 1024 / 1024:.2f} MB")
        print(f"  Cleaned size: {cleaned_size / 1024 / 1024:.2f} MB")
        print(f"  Reduction: {reduction:.1f}%")
        
    except FileNotFoundError as e:
        print(f"✗ Error: {e}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"✗ JSON parse error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"✗ Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
