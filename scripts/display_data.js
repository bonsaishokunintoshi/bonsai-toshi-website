fetch('data/youtube.json')
    .then(response => response.json())
    .then(videos => {
        const youtubeContainer = document.getElementById('youtube-videos');
        videos.forEach(video => {
            const videoElement = document.createElement('div');
            videoElement.className = 'video';
            videoElement.innerHTML = `
                <h3>${video.title}</h3>
                <a href="${video.url}" target="_blank">
                    <img src="${video.thumbnail}" alt="${video.title}">
                </a>
                <p>${video.description}</p>
                <p>Published on: ${new Date(video.publishedAt).toLocaleDateString()}</p>
            `;
            youtubeContainer.appendChild(videoElement);
        });
    });

fetch('data/instagram.json')
    .then(response => response.json())
    .then(posts => {
        const instagramContainer = document.getElementById('instagram-posts');
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post';
            postElement.innerHTML = `
                <a href="${post.post_url}" target="_blank">
                    <img src="${post.image_url}" alt="Instagram Post">
                </a>
                <p>${post.caption}</p>
            `;
            instagramContainer.appendChild(postElement);
        });
    }); 