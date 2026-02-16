import os
from dotenv import load_dotenv

def main():
    load_dotenv()
    print("Environment variables loaded.")
    # Check if a python package from requirements.txt is available
    try:
        import googleapiclient
        print("Google API Client is available.")
    except ImportError:
        print("Google API Client is NOT available.")
    
    # Check directory structure
    required_dirs = ["directives", "execution", ".tmp"]
    for d in required_dirs:
        if os.path.isdir(d):
            print(f"Directory '{d}' exists.")
        else:
            print(f"Directory '{d}' is MISSING.")

if __name__ == "__main__":
    main()
