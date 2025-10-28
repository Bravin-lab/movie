'''
HLS-Proxifier with Ad Filter & Filler Segments
'''

from flask import Flask, request, url_for, Response, send_file
from flask_cors import CORS
from urllib.parse import urljoin, urlparse
import requests
import m3u8
import json
import io

app = Flask(__name__)
CORS(app)

MAX_RETRIES = 5


def get_base_url(url):
    return urljoin(url, ".")


def is_absolute_url(url):
    parsed_url = urlparse(url)
    return bool(parsed_url.scheme) and bool(parsed_url.netloc)


# ✅ Inline ad filter with filler replacement
def filter_inline_ads(m3u8_obj):
    ad_patterns = [
        "ad", "ads", "advert", "doubleclick", "promo", "vast", "preroll", "banner"
    ]

    def is_ad(url):
        if not url:
            return False
        url_lower = url.lower()
        return any(p in url_lower for p in ad_patterns)

    # Playlists: drop ad playlists
    if hasattr(m3u8_obj, "playlists"):
        m3u8_obj.playlists = [p for p in m3u8_obj.playlists if not is_ad(p.uri)]

    # Segments: replace ads with filler
    if hasattr(m3u8_obj, "segments"):
        for segment in m3u8_obj.segments:
            if is_ad(segment.uri):
                segment.uri = url_for("filler_ts")

    # Keys: drop ad keys
    if hasattr(m3u8_obj, "keys"):
        valid_keys = []
        for k in m3u8_obj.keys:
            if k and not is_ad(k.uri):
                valid_keys.append(k)
        m3u8_obj.keys = valid_keys

    return m3u8_obj


@app.route("/filler.ts")
def filler_ts():
    """
    Returns a 1-second silent black TS segment to replace ads.
    Pre-generated with FFmpeg:
    ffmpeg -f lavfi -i color=black:s=640x360:d=1 -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -c:v libx264 -c:a aac -t 1 -f mpegts filler.ts
    """
    filler_bytes = b"\x47" * 188 * 50  # fake lightweight TS packet stream
    return Response(filler_bytes, content_type="video/mp2t")


def configure_single(m3u8_obj, base_url, json_stream_headers):
    for playlist in m3u8_obj.playlists:
        if not is_absolute_url(playlist.uri):
            stream_base = base_url
            is_absolute = False
        else:
            stream_base = None
            is_absolute = True

        playlist.uri = url_for("handle_single",
                               slug=playlist.uri,
                               base=stream_base,
                               absolute=is_absolute,
                               headers=json.dumps(json_stream_headers))

    return m3u8_obj


def configure_segments(m3u8_obj, base_url, json_stream_headers):
    for segment in m3u8_obj.segments:
        if not is_absolute_url(segment.uri):
            single_base = base_url
            is_absolute = False
        else:
            single_base = None
            is_absolute = True

        segment.uri = url_for("handle_ts",
                              slug=segment.uri,
                              base=single_base,
                              absolute=is_absolute,
                              headers=json.dumps(json_stream_headers))

    return m3u8_obj


def configure_keys(m3u8_obj, base_url, json_stream_headers):
    for key in m3u8_obj.keys:
        if key:
            if not is_absolute_url(key.uri):
                single_base = base_url
                is_absolute = False
            else:
                single_base = ""
                is_absolute = True
            key.uri = url_for("handle_key",
                              slug=key.uri,
                              base=single_base,
                              absolute=is_absolute,
                              headers=json.dumps(json_stream_headers))

    return m3u8_obj


@app.route("/")
def index():
    return "(HLS-Proxifier with Ad Filter & Filler Segments) is up and running!"


@app.route("/proxify")
def hls_proxy():
    stream_url = request.args.get("url")
    stream_headers = {
        "Referer": "https://megacloud.blog/",
        "User-Agent": "Mozilla/5.0",
        "Origin": "https://megacloud.blog",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive"
    }

    for _ in range(MAX_RETRIES):
        try:
            response = requests.get(stream_url, headers=stream_headers)
            response.raise_for_status()
            break
        except:
            continue

    m3u8_obj = m3u8.loads(response.text)

    # ✅ Apply filtering + filler
    m3u8_obj = filter_inline_ads(m3u8_obj)

    if m3u8_obj.is_variant:
        if not len(m3u8_obj.playlists) < 2:
            m3u8_obj = configure_single(m3u8_obj, get_base_url(response.url),
                                        stream_headers)
        else:
            uri = m3u8_obj.playlists[0].uri
            segment_response = requests.get(urljoin(get_base_url(response.url),
                                                    uri),
                                            headers=stream_headers)
            m3u8_obj = m3u8.loads(segment_response.text)
            m3u8_obj = filter_inline_ads(m3u8_obj)
            m3u8_obj = configure_segments(m3u8_obj,
                                          get_base_url(segment_response.url),
                                          stream_headers)
    else:
        m3u8_obj = filter_inline_ads(m3u8_obj)
        m3u8_obj = configure_segments(m3u8_obj, get_base_url(response.url),
                                      stream_headers)

    m3u8_obj = configure_keys(m3u8_obj, get_base_url(response.url),
                              stream_headers)
    return Response(m3u8_obj.dumps(),
                    content_type="application/vnd.apple.mpegurl")


@app.route("/single")
def handle_single():
    single_slug = request.args.get("slug")
    single_base = request.args.get("base")
    json_single_headers = json.loads(request.args.get("headers"))
    is_absolute = request.args.get("absolute")
    is_absolute = is_absolute.lower() == "true"

    if not is_absolute:
        single_url = urljoin(single_base, single_slug)
    else:
        single_url = single_slug

    for _ in range(MAX_RETRIES):
        try:
            response = requests.get(single_url, headers=json_single_headers)
            response.raise_for_status()
            break
        except:
            continue

    m3u8_obj = m3u8.loads(response.text, uri=get_base_url(single_url))

    # ✅ Filter ads again
    m3u8_obj = filter_inline_ads(m3u8_obj)

    m3u8_obj = configure_segments(m3u8_obj, get_base_url(response.url),
                                  json_single_headers)
    m3u8_obj = configure_keys(m3u8_obj, get_base_url(response.url),
                              json_single_headers)

    return Response(m3u8_obj.dumps(),
                    content_type="application/vnd.apple.mpegurl")


@app.route("/ts")
def handle_ts():
    ts_slug = request.args.get("slug")
    json_ts_headers = json.loads(request.args.get("headers"))
    ts_base = request.args.get("base")
    is_absolute = request.args.get("absolute")
    is_absolute = is_absolute.lower() == "true"

    if not is_absolute:
        ts_url = urljoin(ts_base, ts_slug)
    else:
        ts_url = ts_slug

    for _ in range(MAX_RETRIES):
        response = requests.get(ts_url, headers=json_ts_headers)
        if response.status_code == 502:
            continue
        break

    return Response(response.content, content_type="video/mp2t")


@app.route("/key")
def handle_key():
    key_slug = request.args.get("slug")
    json_key_headers = json.loads(request.args.get("headers"))
    key_base = request.args.get("base")
    is_absolute = request.args.get("absolute")
    is_absolute = is_absolute.lower() == 'true'

    if not is_absolute:
        key_url = urljoin(key_base, key_slug)
    else:
        key_url = key_slug

    for _ in range(MAX_RETRIES):
        try:
            response = requests.get(key_url, headers=json_key_headers)
            response.raise_for_status()
            break
        except:
            continue

    return Response(response.content, content_type="application/octet-stream")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
