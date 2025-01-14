import os
import instaloader
import json
from datetime import datetime, timedelta
import pathlib

PROFILE_NAME = "bonsai_toshi"

def fetch_instagram_posts():
    json_path = pathlib.Path('data/instagram.json')
    posts_data = []

    try:
        L = instaloader.Instaloader()
        profile = instaloader.Profile.from_username(L.context, PROFILE_NAME)
        
        print(f"Fetching posts from Instagram profile: {PROFILE_NAME}")
        
        for post in profile.get_posts():
            try:
                post_info = {
                    'post_url': f"https://www.instagram.com/p/{post.shortcode}/",
                    'caption': post.caption if post.caption else "",
                    'timestamp': int(post.date_utc.timestamp()),
                    'media_url': post.url
                }
                posts_data.append(post_info)
                print(f"Fetched post from {post.date_local.strftime('%Y-%m-%d')}")
                
            except Exception as e:
                print(f"Error processing post: {e}")
                continue
        
        # Sort posts by date (newest first)
        posts_data.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Save to file
        os.makedirs('data', exist_ok=True)
        with open('data/instagram.json', 'w', encoding='utf-8') as f:
            json.dump(posts_data, f, ensure_ascii=False, indent=2)
        print(f"Successfully saved {len(posts_data)} Instagram posts")
        
    except Exception as e:
        print(f"Error fetching Instagram data: {e}")
        # エラー時は空の配列を保存
        with open('data/instagram.json', 'w', encoding='utf-8') as f:
            json.dump([], f)

if __name__ == "__main__":
    fetch_instagram_posts() 