import os
import instaloader
import json
import traceback
from datetime import datetime, timedelta
import pathlib

PROFILE_NAME = "bonsai_toshi"

def fetch_instagram_posts():
    json_path = pathlib.Path('data/instagram.json')
    posts_data = []

    try:
        print("Initializing Instaloader...")
        L = instaloader.Instaloader(max_connection_attempts=1)
        
        print(f"Attempting to get profile: {PROFILE_NAME}")
        profile = instaloader.Profile.from_username(L.context, PROFILE_NAME)
        print(f"Successfully got profile: {profile.username}, Posts: {profile.mediacount}")
        
        print(f"Fetching posts from Instagram profile: {PROFILE_NAME}")
        post_count = 0
        
        for post in profile.get_posts():
            try:
                post_info = {
                    'post_url': f"https://www.instagram.com/p/{post.shortcode}/",
                    'caption': post.caption if post.caption else "",
                    'timestamp': int(post.date_utc.timestamp()),
                    'media_url': post.url
                }
                posts_data.append(post_info)
                post_count += 1
                print(f"Fetched post {post_count} from {post.date_local.strftime('%Y-%m-%d')}")
                
            except Exception as e:
                print(f"Error processing post: {str(e)}")
                print(f"Error details: {traceback.format_exc()}")
                continue
        
        print(f"Total posts fetched: {post_count}")
        
        # Sort posts by date (newest first)
        posts_data.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Save to file
        os.makedirs('data', exist_ok=True)
        with open('data/instagram.json', 'w', encoding='utf-8') as f:
            json.dump(posts_data, f, ensure_ascii=False, indent=2)
        print(f"Successfully saved {len(posts_data)} Instagram posts to {json_path}")
        
    except instaloader.exceptions.ConnectionException as e:
        print(f"Connection error: {str(e)}")
        print(f"Error details: {traceback.format_exc()}")
        with open('data/instagram.json', 'w', encoding='utf-8') as f:
            json.dump([], f)
    except instaloader.exceptions.ProfileNotExistsException as e:
        print(f"Profile not found: {str(e)}")
        print(f"Error details: {traceback.format_exc()}")
        with open('data/instagram.json', 'w', encoding='utf-8') as f:
            json.dump([], f)
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        print(f"Error details: {traceback.format_exc()}")
        with open('data/instagram.json', 'w', encoding='utf-8') as f:
            json.dump([], f)

if __name__ == "__main__":
    fetch_instagram_posts()