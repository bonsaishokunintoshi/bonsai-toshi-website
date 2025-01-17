// 設定
const CONFIG = {
    itemsPerPage: 12,
    loadMoreThreshold: 200,
    initialLoad: 24,
    maxRetries: 3,  // 最大リトライ回数
    retryDelay: 1000  // リトライ間隔（ミリ秒）
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
    if (!dateString) return '';
    
    try {
        // Unix timestampの場合（数値の場合）
        if (typeof dateString === 'number') {
            const date = new Date(dateString * 1000);
            return date.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        // 通常の日付文字列の場合
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return '';  // 無効な日付の場合は空文字を返す
        }
        
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Date formatting error:', error);
        return '';
    }
}

// セキュリティ対策: HTMLエスケープ関数
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function processDescription(description) {
    if (!description) return '';
    
    let processedDesc = description;
    
    // 共通の前置きテキストを削除
    const commonPrefixes = [
        "チャンネル登録よろしくお願いします",
        "【チャンネル登録】",
        "▼チャンネル登録は下記から",
        "チャンネル登録",
        "いつもご視聴ありがとうございます"
    ];
    
    commonPrefixes.forEach(prefix => {
        const index = processedDesc.toLowerCase().indexOf(prefix.toLowerCase());
        if (index !== -1) {
            const nextLineBreak = processedDesc.indexOf('\n', index);
            if (nextLineBreak !== -1) {
                processedDesc = processedDesc.substring(0, index) + processedDesc.substring(nextLineBreak + 1);
            }
        }
    });
    
    processedDesc = processedDesc
        .split('\n')
        .filter(line => line.trim())
        .join('\n')
        .trim();
    
    // 文字数制限とHTMLエスケープ
    return escapeHtml(processedDesc.length > 100 ? processedDesc.substring(0, 100) + '...' : processedDesc);
}

function getHighQualityThumbnail(thumbnailUrl) {
    // 動画IDを抽出
    const videoId = thumbnailUrl.match(/vi\/([^\/]+)/)?.[1];
    if (!videoId) return thumbnailUrl;

    // 高品質なサムネイルURLを構築（フォールバック付き）
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

function handleImageError(img) {
    // YouTubeサムネイルの場合、低画質版にフォールバック
    if (img.src.includes('maxresdefault.jpg')) {
        img.src = img.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
        return;
    }
    // Instagram画像の場合、プレースホルダー画像を表示
    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24"><path fill="%23999" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
}

// コンテンツ表示関数
function displayYouTubeVideo(video, container) {
    if (!video || !container) return;

    const videoElement = document.createElement('div');
    videoElement.className = 'video fade-in';
    
    const processedDescription = processDescription(video.description);
    const highQualityThumbnail = getHighQualityThumbnail(video.thumbnail);
    const title = escapeHtml(video.title);
    const videoId = video.url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/sandalsResorts#\w\/\w\/.*\/))([^\/&]{10,12})/)?.[1];
    
    // 構造化データの生成
    const videoSchema = {
        "@type": "VideoObject",
        "name": title,
        "description": processedDescription,
        "thumbnailUrl": highQualityThumbnail,
        "uploadDate": video.publishedAt,
        "contentUrl": video.url,
        "embedUrl": videoId ? `https://www.youtube.com/embed/${videoId}` : undefined
    };
    
    videoElement.innerHTML = `
        <article itemscope itemtype="http://schema.org/VideoObject">
            <meta itemprop="uploadDate" content="${video.publishedAt}">
            <meta itemprop="thumbnailUrl" content="${escapeHtml(highQualityThumbnail)}">
            <a href="${escapeHtml(video.url)}" target="_blank" rel="noopener">
                <img src="${escapeHtml(highQualityThumbnail)}" 
                     alt="${title}" 
                     loading="lazy" 
                     onload="this.style.opacity='1'"
                     onerror="this.onerror=null; handleImageError(this);">
            </a>
            <h3 class="video-title" itemprop="name">${title}</h3>
            <p class="video-description" itemprop="description">${processedDescription}</p>
            <p class="video-date">投稿日: ${formatDate(video.publishedAt)}</p>
            <script type="application/ld+json">${JSON.stringify(videoSchema)}</script>
        </article>
    `;

    const img = videoElement.querySelector('img');
    img.onerror = () => handleImageError(img);
    
    container.appendChild(videoElement);
}

function displayInstagramPost(post, container) {
    if (!post || !container) return;

    const postElement = document.createElement('div');
    postElement.className = 'post fade-in';
    
    const caption = escapeHtml(post.caption || '');
    const dateStr = formatDate(post.timestamp) || '';
    const dateDisplay = dateStr ? `<p class="post-date">投稿日: ${dateStr}</p>` : '';
    
    postElement.innerHTML = `
        <a href="${escapeHtml(post.post_url)}" target="_blank" rel="noopener">
            <img src="${escapeHtml(post.media_url)}" 
                 alt="Instagram投稿" 
                 loading="lazy"
                 onload="this.style.opacity='1'"
                 onerror="handleImageError(this)">
        </a>
        <p class="post-caption">${caption}</p>
        ${dateDisplay}
    `;

    container.appendChild(postElement);
}

// データ取得の再試行を行う関数
async function fetchWithRetry(url, retries = CONFIG.maxRetries) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
            return fetchWithRetry(url, retries - 1);
        }
        throw error;
    }
}

// データ取得関数
async function fetchData(type, isInitialLoad = false) {
    if (state[type].loading || (!isInitialLoad && !state[type].hasMore)) return;

    state[type].loading = true;
    const container = document.getElementById(`${type}-${type === 'youtube' ? 'videos' : 'posts'}`);
    if (!container) {
        console.error(`Container for ${type} not found`);
        return;
    }

    const loadingElement = createLoadingElement();
    container.appendChild(loadingElement);

    try {
        if (state[type].items.length === 0) {
            state[type].items = await fetchWithRetry(`data/${type}.json`);
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
        if (container.contains(loadingElement)) {
            container.removeChild(loadingElement);
        }
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