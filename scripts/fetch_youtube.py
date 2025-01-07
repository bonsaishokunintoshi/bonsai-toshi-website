import os
import requests
import json
from datetime import datetime, timedelta
import pathlib

API_KEY = os.getenv('YOUTUBE_API_KEY')
CHANNEL_ID = "UCy_59BWo8cJwQ6EGxCW4C3w"

def fetch_youtube_videos():
    json_path = pathlib.Path('data/youtube.json')
    existing_data = []
    is_initial_fetch = not json_path.exists()

    # 既存のデータがある場合は読み込む
    if not is_initial_fetch:
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        except Exception as e:
            print(f"Error loading existing data: {e}")
            return

    video_data = []
    next_page_token = None
    one_week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat("T") + "Z"
    
    while True:
        # Build URL with pagination
        url = f"https://www.googleapis.com/youtube/v3/search?key={API_KEY}&channelId={CHANNEL_ID}&part=snippet,id&order=date&maxResults=50&type=video"
        if not is_initial_fetch:
            url += f"&publishedAfter={one_week_ago}"
        if next_page_token:
            url += f"&pageToken={next_page_token}"
            
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            
            if 'items' not in data:
                print("No items found in response")
                break
                
            for item in data['items']:
                if 'id' in item and 'videoId' in item['id']:
                    video_info = {
                        'title': item['snippet']['title'],
                        'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                        'thumbnail': item['snippet']['thumbnails']['default']['url'],
                        'description': item['snippet']['description'],
                        'publishedAt': item['snippet']['publishedAt']
                    }
                    video_data.append(video_info)
            
            # 初回取得でない場合は1ページ目だけで十分
            if not is_initial_fetch:
                break
                
            # Check if there are more pages
            next_page_token = data.get('nextPageToken')
            if not next_page_token:
                break
                
        except requests.exceptions.RequestException as e:
            print(f"Error fetching YouTube data: {e}")
            break
    
    if not is_initial_fetch:
        # 既存のデータから1週間より古いものを保持
        old_data = [v for v in existing_data if v['publishedAt'] < one_week_ago]
        # 新しいデータと結合
        video_data.extend(old_data)
    
    # Sort videos by published date (newest first)
    video_data.sort(key=lambda x: x['publishedAt'], reverse=True)
    
    # Save to file
    try:
        with open('data/youtube.json', 'w', encoding='utf-8') as f:
            json.dump(video_data, f, ensure_ascii=False, indent=2)
        print(f"Successfully saved {len(video_data)} YouTube videos")
    except IOError as e:
        print(f"Error saving YouTube data: {e}")

if __name__ == "__main__":
    fetch_youtube_videos() 