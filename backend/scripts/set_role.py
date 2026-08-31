"""Grant a Firebase Auth user an app role (admin | user).

    python backend/scripts/set_role.py --email you@example.com --role admin

Works against the Auth emulator when FIREBASE_AUTH_EMULATOR_HOST is set.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.firebase import auth_client  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--email")
    g.add_argument("--uid")
    ap.add_argument("--role", choices=["admin", "user"], required=True)
    args = ap.parse_args()

    a = auth_client()
    user = a.get_user_by_email(args.email) if args.email else a.get_user(args.uid)
    a.set_custom_user_claims(user.uid, {"role": args.role})
    print(f"{user.email or user.uid} -> role={args.role}")
    print("The user must sign out / refresh their ID token for the change to take effect.")


if __name__ == "__main__":
    main()
