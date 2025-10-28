# Python Proxy Server for HLS Streaming

This is a FastAPI-based proxy server to proxy HLS streams, filter out ads from manifests, and serve video segments. It is designed to be hosted on a VPS and used by the Next.js streaming app.

## Setup

1. Create a Python virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the server locally for testing:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Deployment

- Use a process manager like `systemd` or `pm2` to keep the server running.
- Use Nginx as a reverse proxy with SSL termination.
- Update your Next.js app environment variable `NEXT_PUBLIC_PYTHON_PROXY_URL` to point to your VPS domain.

## Usage

The proxy endpoint is:

```
GET /proxy?url={target_hls_url}
```

It will fetch the target URL, filter ad-related lines from HLS manifests, and proxy the content.

## Notes

- Adjust CORS settings in `app.py` for production.
- Monitor logs for errors and performance.
