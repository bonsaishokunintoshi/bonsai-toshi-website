import os
import requests
import json
from datetime import datetime

API_KEY = os.getenv('YOUTUBE_API_KEY')
CHANNEL_ID = "UCy_59BWo8cJwQ6EGxCW4C3w"

def fetch_youtube_videos():
    video_data = []
    next_page_token = None
    
    while True:
        # Build URL with pagination
        url = f"https://www.googleapis.com/youtube/v3/search?key={API_KEY}&channelId={CHANNEL_ID}&part=snippet,id&order=date&maxResults=50&type=video"
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
            
            # Check if there are more pages
            next_page_token = data.get('nextPageToken')
            if not next_page_token:
                break
                
        except requests.exceptions.RequestException as e:
            print(f"Error fetching YouTube data: {e}")
            break
            
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