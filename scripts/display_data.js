// 設定
const CONFIG = {
    itemsPerPage: 6,
    loadMoreThreshold: 100
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

// コンテンツ表示関数
function displayYouTubeVideo(video, container) {
    const videoElement = document.createElement('div');
    videoElement.className = 'video fade-in';
    
    const processedDescription = processDescription(video.description);
    
    videoElement.innerHTML = `
        <a href="${video.url}" target="_blank" rel="noopener">
            <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
        </a>
        <h3 class="video-title">${video.title}</h3>
        <p class="video-description">${processedDescription}</p>
        <p class="video-date">投稿日: ${formatDate(video.publishedAt)}</p>
    `;
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
async function fetchData(type) {
    if (state[type].loading || !state[type].hasMore) return;

    state[type].loading = true;
    const container = document.getElementById(`${type}-videos`);
    const loadingElement = createLoadingElement();
    container.appendChild(loadingElement);

    try {
        const response = await fetch(`data/${type}.json`);
        if (!response.ok) throw new Error(`${type}データの取得に失敗しました`);
        
        const data = await response.json();
        state[type].items = data;
        
        const start = state[type].page * CONFIG.itemsPerPage;
        const end = start + CONFIG.itemsPerPage;
        const items = state[type].items.slice(start, end);
        
        items.forEach(item => {
            if (type === 'youtube') {
                displayYouTubeVideo(item, container);
            } else {
                displayInstagramPost(item, container);
            }
        });

        state[type].hasMore = end < state[type].items.length;
        state[type].page++;
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

// 無限スクロール
function handleScroll() {
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.offsetHeight;
    
    if (documentHeight - scrollPosition < CONFIG.loadMoreThreshold) {
        fetchData('youtube');
        fetchData('instagram');
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    fetchData('youtube');
    fetchData('instagram');
    window.addEventListener('scroll', handleScroll);
});

// エラーハンドリング
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // エラー追跡サービスへの送信などを追加可能
}); 