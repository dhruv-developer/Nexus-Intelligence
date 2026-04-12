#!/usr/bin/env python3
"""
Simple runner script for the realistic dataset generator.
"""

import sys
import os

# Add the parent directory to the path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.generate_realistic_datasets import main

if __name__ == "__main__":
    print("Starting realistic dataset generation...")
    print("This will create datasets that look like real business data.")
    print("The datasets will be saved in the 'generated_datasets' directory.\n")
    
    try:
        main()
        print("\nDataset generation completed successfully!")
        print("Check the 'generated_datasets' directory for your files.")
    except Exception as e:
        print(f"Error during dataset generation: {e}")
        sys.exit(1)
