import os
import requests
import json
from datetime import datetime, timedelta

API_KEY = os.getenv('YOUTUBE_API_KEY')
CHANNEL_ID = "UCy_59BWo8cJwQ6EGxCW4C3w"  # ここに対象のYouTubeチャンネルIDを入力

def fetch_youtube_videos():
    three_years_ago = (datetime.now() - timedelta(days=3*365)).isoformat("T") + "Z"
    url = f"https://www.googleapis.com/youtube/v3/search?key={API_KEY}&channelId={CHANNEL_ID}&part=snippet,id&order=date&publishedAfter={three_years_ago}&maxResults=50"
    response = requests.get(url)
    videos = response.json().get('items', [])

    video_data = []
    for video in videos:
        video_info = {
            'title': video['snippet']['title'],
            'url': f"https://www.youtube.com/watch?v={video['id']['videoId']}",
            'thumbnail': video['snippet']['thumbnails']['default']['url'],
            'description': video['snippet']['description'],
            'publishedAt': video['snippet']['publishedAt']
        }
        video_data.append(video_info)

    with open('data/youtube.json', 'w', encoding='utf-8') as f:
        json.dump(video_data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    fetch_youtube_videos() 