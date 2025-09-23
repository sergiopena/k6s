import re
import sys
import argparse
from typing import Dict, List, Optional


def parse_line(line: str) -> Optional[Dict]:
    """
    Parse a single line with the format:
    { group:::Query type structure::Struc type contentconstraint }..........................................................................................: avg=0s min=0s med=0s max=0s p(90)=0s p(95)=0s
    """
    # Remove leading/trailing whitespace
    line = line.strip()
    
    if not line:
        return None
    
    # Pattern to match the format
    pattern = r'.*p\(95\)=(.+?)(ms|s)'
    match = re.match(pattern, line)
    if not match:
        return None
    
    # Extract p95 value and unit
    p95_value = match.group(1)
    p95_unit = match.group(2)
    
    return {
        'p95_value': p95_value,
        'p95_unit': p95_unit,
        'p95': f"{p95_value}{p95_unit}",
        'raw_line': line
    }
    


def parse_file(file_path: str) -> List[Dict]:
    """
    Parse all lines in the given file and return parsed data
    """
    parsed_data = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            for line_num, line in enumerate(file, 1):
                parsed = parse_line(line)
                if parsed:
                    parsed['line_number'] = line_num
                    parsed_data.append(parsed)
                else:
                    print(f"Warning: Could not parse line {line_num}: {line.strip()}")
    
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
        return []
    except Exception as e:
        print(f"Error reading file: {e}")
        return []
    
    return parsed_data


def print_parsed_data(parsed_data: List[Dict]):
    """
    Print the parsed data in a formatted way
    """
    if not parsed_data:
        print("No data was parsed.")
        return
    
    print(f"\nParsed {len(parsed_data)} lines:\n")
    
    for item in parsed_data:
        if item['p95_unit'] == 'ms':
            item['p95_value'] = float(item['p95_value']) / 1000
        print(f"{item['p95_value']}")



def main():
    parser = argparse.ArgumentParser(description='Parse log files with specific format')
    parser.add_argument('file_path', help='Path to the file to parse')
    parser.add_argument('--output', '-o', help='Output file for parsed data (optional)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    if args.verbose:
        print(f"Parsing file: {args.file_path}")
    
    # Parse the file
    parsed_data = parse_file(args.file_path)
    
    if args.verbose:
        print_parsed_data(parsed_data)
    
    # Save to output file if specified
    if args.output and parsed_data:
        try:
            import json
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(parsed_data, f, indent=2, ensure_ascii=False)
            print(f"Parsed data saved to: {args.output}")
        except Exception as e:
            print(f"Error saving output file: {e}")
    
    print(f"Successfully parsed {len(parsed_data)} lines from {args.file_path}")


if __name__ == "__main__":
    main()
