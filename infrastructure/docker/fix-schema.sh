#!/bin/bash
set -e

cd /app/apps/api/src/infrastructure/database/prisma

# Remove BOM if exists and add binary target
python3 - <<'EOF'
import sys

path = 'schema.prisma'
with open(path, 'rb') as f:
    content = f.read()

# Remove UTF-8 BOM
if content.startswith(b'\xef\xbb\xbf'):
    content = content[3:]

# Decode and fix
content_str = content.decode('utf-8')
content_str = content_str.replace(
    'generator client {\n  provider = "prisma-client-js"\n}',
    'generator client {\n  provider      = "prisma-client-js"\n  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]\n}'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content_str)

print("Schema fixed")
EOF
