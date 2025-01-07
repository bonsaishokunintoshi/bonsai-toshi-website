// 設定
const CONFIG = {
    itemsPerPage: 12,
    loadMoreThreshold: 200,
    initialLoad: 24  // 初期表示数を増やす
};

// 状態管理
let state = {
    youtube: {
        page: 0,
        items: [],
        loading: false,
        hasMore: true
    },
    instagram: {
        page: 0,
        items: [],
        loading: false,
        hasMore: true
    }
};

// ユーティリティ関数
function createLoadingElement() {
    const loading = document.createElement('div');
    loading.className = 'loading';
    return loading;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function processDescription(description) {
    // 共通の前置きテキストを削除
    const commonPrefixes = [
        "チャンネル登録よろしくお願いします",
        "【チャンネル登録】",
        "▼チャンネル登録は下記から",
        "チャンネル登録",
        "いつもご視聴ありがとうございます"
    ];
    
    let processedDesc = description;
    commonPrefixes.forEach(prefix => {
        const index = processedDesc.toLowerCase().indexOf(prefix.toLowerCase());
        if (index !== -1) {
            // 前置き部分とその後の改行までを削除
            const nextLineBreak = processedDesc.indexOf('\n', index);
            if (nextLineBreak !== -1) {
                processedDesc = processedDesc.substring(0, index) + processedDesc.substring(nextLineBreak + 1);
            }
        }
    });
    
    // 空白行の削除と文字数制限
    processedDesc = processedDesc
        .split('\n')
        .filter(line => line.trim())
        .join('\n')
        .trim();
    
    return processedDesc.length > 100 ? processedDesc.substring(0, 100) + '...' : processedDesc;
}

function getHighQualityThumbnail(thumbnailUrl) {
    // 動画IDを抽出
    const videoId = thumbnailUrl.match(/vi\/([^\/]+)/)?.[1];
    if (!videoId) return thumbnailUrl;

    // 高品質なサムネイルURLを構築
    const qualities = [
        'maxresdefault.jpg',  // 1920x1080
        'sddefault.jpg',      // 640x480
        'hqdefault.jpg'       // 480x360
    ];

    // 最高品質の画像URLを返す
    return `https://i.ytimg.com/vi/${videoId}/${qualities[0]}`;
}

// コンテンツ表示関数
function displayYouTubeVideo(video, container) {
    const videoElement = document.createElement('div');
    videoElement.className = 'video fade-in';
    
    const processedDescription = processDescription(video.description);
    const highQualityThumbnail = getHighQualityThumbnail(video.thumbnail);
    
    // 画像読み込みエラー時の処理を改善
    const handleImageError = (img) => {
        const videoId = video.thumbnail.match(/vi\/([^\/]+)/)?.[1];
        if (!videoId) return;

        const qualities = [
            'maxresdefault.jpg',
            'sddefault.jpg',
            'hqdefault.jpg'
        ];

        // 現在の品質のインデックスを取得
        const currentQuality = qualities.findIndex(q => img.src.includes(q));
        if (currentQuality < qualities.length - 1) {
            // 次の品質を試す
            img.src = `https://i.ytimg.com/vi/${videoId}/${qualities[currentQuality + 1]}`;
        }
    };
    
    videoElement.innerHTML = `
        <a href="${video.url}" target="_blank" rel="noopener">
            <img src="${highQualityThumbnail}" 
                 alt="${video.title}" 
                 loading="lazy" 
                 onload="this.style.opacity='1'"
                 onerror="handleImageError(this)">
        </a>
        <h3 class="video-title">${video.title}</h3>
        <p class="video-description">${processedDescription}</p>
        <p class="video-date">投稿日: ${formatDate(video.publishedAt)}</p>
    `;

    // エラーハンドラを設定
    const img = videoElement.querySelector('img');
    img.onerror = () => handleImageError(img);
    
    container.appendChild(videoElement);
}

function displayInstagramPost(post, container) {
    const postElement = document.createElement('div');
    postElement.className = 'post fade-in';
    postElement.innerHTML = `
        <a href="${post.post_url}" target="_blank" rel="noopener">
            <img src="${post.image_url}" alt="Instagram投稿" loading="lazy">
        </a>
        <p class="post-caption">${post.caption}</p>
        <p class="post-date">投稿日: ${formatDate(post.timestamp)}</p>
    `;
    container.appendChild(postElement);
}

// データ取得関数
async function fetchData(type, isInitialLoad = false) {
    if (state[type].loading || (!isInitialLoad && !state[type].hasMore)) return;

    state[type].loading = true;
    const container = document.getElementById(`${type}-${type === 'youtube' ? 'videos' : 'posts'}`);
    const loadingElement = createLoadingElement();
    container.appendChild(loadingElement);

    try {
        // データがまだ読み込まれていない場合のみ取得
        if (state[type].items.length === 0) {
            const response = await fetch(`data/${type}.json`);
            if (!response.ok) throw new Error(`${type}データの取得に失敗しました`);
            const data = await response.json();
            state[type].items = data;
        }
        
        const itemsToLoad = isInitialLoad ? CONFIG.initialLoad : CONFIG.itemsPerPage;
        const start = state[type].page * (isInitialLoad ? itemsToLoad : CONFIG.itemsPerPage);
        const end = start + itemsToLoad;
        const items = state[type].items.slice(start, end);
        
        if (items.length > 0) {
            items.forEach(item => {
                if (type === 'youtube') {
                    displayYouTubeVideo(item, container);
                } else {
                    displayInstagramPost(item, container);
                }
            });

            state[type].hasMore = end < state[type].items.length;
            state[type].page++;
        } else {
            state[type].hasMore = false;
        }
    } catch (error) {
        console.error(`Error fetching ${type} data:`, error);
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = `${type}のデータ取得中にエラーが発生しました。`;
        container.appendChild(errorElement);
    } finally {
        container.removeChild(loadingElement);
        state[type].loading = false;
    }
}

// スクロールハンドラの改善
function handleScroll() {
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.offsetHeight;
    
    if (documentHeight - scrollPosition < CONFIG.loadMoreThreshold) {
        if (state.youtube.hasMore) {
            fetchData('youtube');
        }
        if (state.instagram.hasMore) {
            fetchData('instagram');
        }
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // 初期ロードでより多くのアイテムを表示
    fetchData('youtube', true);
    fetchData('instagram', true);
    window.addEventListener('scroll', handleScroll);
});

// エラーハンドリング
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // エラー追跡サービスへの送信などを追加可能
}); 