import os
import instaloader
import json
from datetime import datetime

PROFILE_NAME = "bonsai_toshi"

def fetch_instagram_posts():
    try:
        L = instaloader.Instaloader()
        profile = instaloader.Profile.from_username(L.context, PROFILE_NAME)
        
        posts_data = []
        print(f"Fetching posts from Instagram profile: {PROFILE_NAME}")
        
        for post in profile.get_posts():
            try:
                post_info = {
                    'image_url': post.url,
                    'caption': post.caption if post.caption else "",
                    'post_url': f"https://www.instagram.com/p/{post.shortcode}/",
                    'publishedAt': post.date_local.isoformat(),
                    'likes': post.likes,
                    'comments': post.comments
                }
                posts_data.append(post_info)
                print(f"Fetched post from {post.date_local.strftime('%Y-%m-%d')}")
                
            except Exception as e:
                print(f"Error processing post: {e}")
                continue
        
        # Sort posts by date (newest first)
        posts_data.sort(key=lambda x: x['publishedAt'], reverse=True)
        
        # Save to file
        with open('data/instagram.json', 'w', encoding='utf-8') as f:
            json.dump(posts_data, f, ensure_ascii=False, indent=2)
        print(f"Successfully saved {len(posts_data)} Instagram posts")
        
    except Exception as e:
        print(f"Error fetching Instagram data: {e}")

if __name__ == "__main__":
    fetch_instagram_posts() 