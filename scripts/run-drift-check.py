#!/usr/bin/env python3
import json
import urllib.request

req = urllib.request.Request("http://localhost:8000/api/drift/check", method="POST")
with urllib.request.urlopen(req) as response:
    print(json.dumps(json.loads(response.read()), indent=2))
