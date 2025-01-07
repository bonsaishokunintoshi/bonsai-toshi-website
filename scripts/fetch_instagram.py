import os
import instaloader
import json
from datetime import datetime, timedelta

PROFILE_NAME = "bonsai_toshi"

INSTAGRAM_ACCESS_TOKEN = os.getenv('INSTAGRAM_ACCESS_TOKEN')

def fetch_instagram_posts():
    L = instaloader.Instaloader()
    profile = instaloader.Profile.from_username(L.context, PROFILE_NAME)

    three_years_ago = datetime.now() - timedelta(days=3*365)
    posts_data = []
    for post in profile.get_posts():
        if post.date_utc < three_years_ago:
            break
        post_info = {
            'image_url': post.url,
            'caption': post.caption,
            'post_url': f"https://www.instagram.com/p/{post.shortcode}/"
        }
        posts_data.append(post_info)

    with open('data/instagram.json', 'w', encoding='utf-8') as f:
        json.dump(posts_data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    fetch_instagram_posts() 