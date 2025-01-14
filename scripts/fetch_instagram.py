import os
import instaloader
import json
from datetime import datetime, timedelta
import pathlib

PROFILE_NAME = "bonsai_toshi"

def fetch_instagram_posts():
    json_path = pathlib.Path('data/instagram.json')
    existing_data = []
    is_initial_fetch = not json_path.exists()

    # 既存のデータがある場合は読み込む
    if not is_initial_fetch:
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        except Exception as e:
            print(f"Error loading existing data: {e}")
            existing_data = []

    try:
        L = instaloader.Instaloader()
        profile = instaloader.Profile.from_username(L.context, PROFILE_NAME)
        
        posts_data = []
        one_week_ago = datetime.now() - timedelta(days=7)
        print(f"Fetching posts from Instagram profile: {PROFILE_NAME}")
        
        for post in profile.get_posts():
            try:
                # 初回取得でない場合は1週間前より古い投稿は無視
                if not is_initial_fetch and post.date_local < one_week_ago:
                    break
                
                post_info = {
                    'post_url': f"https://www.instagram.com/p/{post.shortcode}/",
                    'caption': post.caption if post.caption else "",
                    'timestamp': int(post.date_utc.timestamp()),
                    'media_url': post.url,  # メディアURLを常に含める
                    'likes': post.likes,
                    'comments': post.comments
                }
                posts_data.append(post_info)
                print(f"Fetched post from {post.date_local.strftime('%Y-%m-%d')}")
                
            except Exception as e:
                print(f"Error processing post: {e}")
                continue
        
        if not is_initial_fetch:
            # 既存のデータから1週間より古いものを保持
            old_data = [p for p in existing_data if datetime.fromtimestamp(p['timestamp']) < one_week_ago]
            # 新しいデータと結合
            posts_data.extend(old_data)
        
        # Sort posts by date (newest first)
        posts_data.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Save to file
        os.makedirs('data', exist_ok=True)
        with open('data/instagram.json', 'w', encoding='utf-8') as f:
            json.dump(posts_data, f, ensure_ascii=False, indent=2)
        print(f"Successfully saved {len(posts_data)} Instagram posts")
        
    except Exception as e:
        print(f"Error fetching Instagram data: {e}")

if __name__ == "__main__":
    fetch_instagram_posts() 