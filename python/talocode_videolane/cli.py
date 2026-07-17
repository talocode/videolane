"""VideoLane Python CLI."""

import sys
import json
import argparse

from . import VideoLaneClient


def main():
    parser = argparse.ArgumentParser(description="VideoLane Python CLI")
    parser.add_argument("command", help="Command to run")
    parser.add_argument("--input", help="Input path")
    parser.add_argument("--plan", help="Plan path")
    parser.add_argument("--title", help="Video title")
    parser.add_argument("--out", help="Output path")
    parser.add_argument("--base-url", default="http://localhost:3110", help="API base URL")

    args = parser.parse_args()
    client = VideoLaneClient(base_url=args.base_url)

    try:
        if args.command == "health":
            result = client.health()
        elif args.command == "doctor":
            result = client.doctor()
        elif args.command == "plan":
            result = client.plan({"input": args.input})
        elif args.command == "metadata":
            result = client.metadata({"plan": args.plan, "title": args.title, "outDir": args.out or "./youtube-metadata"})
        elif args.command == "demo":
            result = client.demo()
        else:
            print(f"Unknown command: {args.command}")
            sys.exit(1)

        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
